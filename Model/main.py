"""
Entry point that wires together the video feed, ROI image processor, and model
processor stages.
"""

from __future__ import annotations

import logging
import signal
import sys
import time
from datetime import datetime
from pathlib import Path
from queue import Queue
from typing import Iterable

import cv2  # type: ignore

from utils.image_processor import ROIImageProcessor
from utils.model import ModelProcessor, YoloModel
from utils.video_processor import VideoFeedWorker, spawn_video_feeds


LOGGER = logging.getLogger(__name__)

# Base directory used to resolve relative paths.
BASE_DIR = Path(__file__).resolve().parent

# --------------------------------------------------------------------------- #
# Configuration section – tweak these values to suit your deployment.
# --------------------------------------------------------------------------- #
VIDEO_PATHS: list[str | int] = [
    # Add absolute or relative paths (or integer webcam indices) to the videos you
    # would like to process. The camera name is derived from the filename stem. If
    # you need a specific camera name (to match the ROI configuration), rename the
    # file or update the ROI JSON accordingly.
    # Example:
    # "data/videos/flint_1.mp4",
    "data/videos/OW_1.MOV"
]

ROI_CONFIG_PATH = BASE_DIR / "data/roi.json"
OUTPUT_DIRECTORY = BASE_DIR / "output/frames"
YOLO_WEIGHTS_PATH = BASE_DIR / "yolo12x.pt"
YOLO_DEVICE: str | None = None  # e.g., "cpu", "cuda:0"

# Sampling interval (seconds) between frames pushed by each video worker.
FRAME_INTERVAL = 1.0

# Maximum number of items allowed in the intermediate queues.
QUEUE_CAPACITY = 10


# --------------------------------------------------------------------------- #
# Helper functions
# --------------------------------------------------------------------------- #
def build_video_feed_map(paths: Iterable[str | int]) -> dict[str, str | int]:
    """
    Build a mapping of camera name to video source.
    """
    mapping: dict[str, str | int] = {}
    seen_names: set[str] = set()
    for idx, source in enumerate(paths):
        if isinstance(source, int):
            name = f"camera_{idx + 1}"
            mapping[name] = source
            continue

        path = Path(source)
        if not path.is_absolute():
            path = BASE_DIR / path
        name = path.stem or f"camera_{idx + 1}"
        # Ensure we don't clobber entries with duplicate stems.
        if name in seen_names:
            name = f"{name}_{idx + 1}"
        seen_names.add(name)
        mapping[name] = str(path)
    return mapping


def create_result_handler(output_dir: Path):
    """
    Factory that returns a handler storing annotated frames and printing results.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    def handler(result: dict, roi_image):
        camera = result.get("camera", "unknown")
        timestamp = result.get("timestamp") or time.time()
        inference = result.get("inference", {})
        detections = inference.get("detections", [])

        timestamp_dt = datetime.fromtimestamp(timestamp)
        print(
            f"[{timestamp_dt.isoformat()}] Camera={camera} detections={len(detections)}"
        )

        annotated = roi_image.copy()
        if annotated.ndim == 2:
            annotated = cv2.cvtColor(annotated, cv2.COLOR_GRAY2BGR)

        for detection in detections:
            box = detection.get("box")
            if not box or len(box) != 4:
                continue
            x_min, y_min, x_max, y_max = [int(value) for value in box]
            center_x = (x_min + x_max) // 2
            center_y = (y_min + y_max) // 2
            cv2.circle(annotated, (center_x, center_y), 6, (0, 255, 0), -1)

        filename = (
            f"{camera}_{timestamp_dt.strftime('%Y%m%d_%H%M%S_%f')}.jpg"
        )
        cv2.imwrite(str(output_dir / filename), annotated)

    return handler


def install_signal_handlers(stop_callback):
    """
    Register signal handlers for graceful shutdown.
    """

    def _handler(signum, _frame):
        LOGGER.info("Received signal %s. Initiating shutdown.", signum)
        stop_callback()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            signal.signal(sig, _handler)
        except ValueError:
            # Signals may not be supported on some platforms (e.g., Windows threads).
            LOGGER.debug("Signal %s not available on this platform.", sig)


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(threadName)s] %(levelname)s: %(message)s",
    )

    if not ROI_CONFIG_PATH.exists():
        LOGGER.error("ROI configuration file %s not found.", ROI_CONFIG_PATH)
        return 1

    if not YOLO_WEIGHTS_PATH.exists():
        LOGGER.error("YOLO weights file %s not found.", YOLO_WEIGHTS_PATH)
        return 1

    video_feed_map = build_video_feed_map(VIDEO_PATHS)
    if not video_feed_map:
        LOGGER.error("No video sources configured. Populate VIDEO_PATHS and retry.")
        return 1

    frame_queue: Queue = Queue(maxsize=QUEUE_CAPACITY)
    roi_queue: Queue = Queue(maxsize=QUEUE_CAPACITY)

    workers: list[VideoFeedWorker] = spawn_video_feeds(
        video_feed_map,
        frame_queue=frame_queue,
        interval=FRAME_INTERVAL,
    )

    roi_processor = ROIImageProcessor(
        input_queue=frame_queue,
        output_queue=roi_queue,
        roi_json=ROI_CONFIG_PATH,
    )
    roi_processor.start()

    result_handler = create_result_handler(OUTPUT_DIRECTORY)
    try:
        model = YoloModel(weights=YOLO_WEIGHTS_PATH, device=YOLO_DEVICE)
    except Exception as exc:
        LOGGER.error("Failed to initialise YOLO model: %s", exc)
        return 1

    model_processor = ModelProcessor(
        input_queue=roi_queue,
        model=model,
        result_handler=result_handler,
    )
    model_processor.start()

    shutdown_requested = False

    def request_shutdown():
        nonlocal shutdown_requested
        shutdown_requested = True

    install_signal_handlers(request_shutdown)

    LOGGER.info("Pipeline started. Press Ctrl+C to stop.")

    try:
        while not shutdown_requested:
            time.sleep(0.5)
    except KeyboardInterrupt:
        LOGGER.info("Keyboard interrupt received. Stopping pipeline.")
    finally:
        LOGGER.info("Shutting down workers.")
        for worker in workers:
            worker.stop()
        roi_processor.stop()
        model_processor.stop()

        for worker in workers:
            worker.join()
        roi_processor.join()
        model_processor.join()

    LOGGER.info("Shutdown complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

