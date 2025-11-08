"""
Image processor stage that consumes frames from the video feed queue, extracts
regions of interest (ROIs), and forwards concatenated ROI images to the model
stage.
"""

from __future__ import annotations

import json
import logging
import threading
from dataclasses import dataclass, field
from pathlib import Path
from queue import Empty, Full, Queue
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np

LOGGER = logging.getLogger(__name__)

RoiBox = Tuple[int, int, int, int]  # (x_min, y_min, x_max, y_max)


def _normalize_box(box: Dict[str, Sequence[int]]) -> RoiBox:
    """
    Convert the ROI definition from the JSON format into a bounding rectangle.
    """
    xs = [point[0] for point in box.values()]
    ys = [point[1] for point in box.values()]
    x_min, x_max = min(xs), max(xs)
    y_min, y_max = min(ys), max(ys)
    return x_min, y_min, x_max, y_max


def load_roi_config(path: str | Path) -> dict[str, list[RoiBox]]:
    """
    Load ROI definitions from a JSON file.
    """
    path = Path(path)
    with path.open("r", encoding="utf-8") as fh:
        raw = json.load(fh)

    rois: dict[str, list[RoiBox]] = {}
    for camera_name, payload in raw.items():
        boxes = [_normalize_box(box) for box in payload.get("boxes", [])]
        rois[camera_name] = boxes
    LOGGER.info("Loaded ROI configuration for %d cameras from %s.", len(rois), path)
    return rois


def concatenate_rois(images: Sequence[np.ndarray]) -> Optional[np.ndarray]:
    """
    Concatenate ROI crops vertically (one on top of another).
    """
    if not images:
        return None

    # Ensure all ROIs have the same width by padding with black pixels if needed.
    widths = [img.shape[1] for img in images]
    target_width = max(widths)

    padded: list[np.ndarray] = []
    for img in images:
        height, width = img.shape[:2]
        if width == target_width:
            padded.append(img)
            continue

        pad_left = (target_width - width) // 2
        pad_right = target_width - width - pad_left
        pad_spec = ((0, 0), (pad_left, pad_right), (0, 0))
        padded.append(np.pad(img, pad_spec, constant_values=0))

    return np.vstack(padded)


@dataclass
class ROIImageProcessor:
    """
    Thread that extracts ROIs from frames and forwards them to the model queue.
    """

    input_queue: Queue
    output_queue: Queue
    roi_json: str | Path
    poll_timeout: float = 0.5
    stop_event: threading.Event = field(default_factory=threading.Event)
    _thread: Optional[threading.Thread] = field(init=False, default=None)
    _rois: dict[str, list[RoiBox]] = field(init=False, default_factory=dict)

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            LOGGER.debug("ROI processor already running.")
            return

        self._rois = load_roi_config(self.roi_json)
        LOGGER.info("Starting ROI image processor.")
        self._thread = threading.Thread(target=self._run, name="ROIProcessor", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        LOGGER.info("Stopping ROI image processor.")
        self.stop_event.set()

    def join(self, timeout: Optional[float] = None) -> None:
        if self._thread:
            self._thread.join(timeout=timeout)

    # ------------------------------------------------------------------ #
    # Internal helpers
    # ------------------------------------------------------------------ #
    def _run(self) -> None:
        while not self.stop_event.is_set():
            try:
                payload = self.input_queue.get(timeout=self.poll_timeout)
            except Empty:
                continue

            camera = payload.get("camera")
            frame = payload.get("frame")
            timestamp = payload.get("timestamp")
            if camera not in self._rois:
                LOGGER.warning("No ROI configuration found for camera %s.", camera)
                continue

            rois = self._rois[camera]
            roi_images = self._extract_rois(frame, rois)
            concatenated = concatenate_rois(roi_images)
            if concatenated is None:
                LOGGER.debug("Camera %s produced no ROI data.", camera)
                continue

            output_package = {
                "camera": camera,
                "timestamp": timestamp,
                "roi_image": concatenated,
                "roi_count": len(roi_images),
            }
            try:
                self.output_queue.put(output_package, timeout=0.1)
                LOGGER.debug("Enqueued ROI image for camera %s.", camera)
            except Full:
                LOGGER.warning("Model queue is full – dropping ROI data for %s.", camera)

    def _extract_rois(self, frame: np.ndarray, rois: Sequence[RoiBox]) -> List[np.ndarray]:
        height, width = frame.shape[:2]
        extracted: list[np.ndarray] = []
        for box in rois:
            x_min, y_min, x_max, y_max = box
            x_min = max(0, min(width, x_min))
            x_max = max(0, min(width, x_max))
            y_min = max(0, min(height, y_min))
            y_max = max(0, min(height, y_max))
            if x_min >= x_max or y_min >= y_max:
                LOGGER.debug("Skipping invalid ROI box %s.", box)
                continue
            extracted.append(frame[y_min:y_max, x_min:x_max])
        return extracted

