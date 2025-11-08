"""
Video feed workers that periodically push frames into a queue for downstream
processing.

Each video feed runs on its own thread so that we can parallelise I/O bound
work (decoding frames, waiting for the next timestamp, etc.) without blocking
the rest of the pipeline.
"""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from queue import Full, Queue
from typing import Optional

try:
    import cv2  # type: ignore
except ImportError as exc:  # pragma: no cover - surface the error clearly
    raise ImportError(
        "The video processor depends on OpenCV (`pip install opencv-python`)."
    ) from exc

LOGGER = logging.getLogger(__name__)


@dataclass
class VideoFeedWorker:
    """
    A single video feed worker that reads frames and posts them to a queue.

    Parameters
    ----------
    name:
        Identifier for the video stream (e.g. camera name). This value will be
        attached to every frame handed off to the queue so downstream stages
        can keep track of the source.
    source:
        Anything OpenCV can open (video file path, RTSP URL, webcam index).
    frame_queue:
        Queue shared with the image processor stage.
    interval:
        Seconds between successive frames that are enqueued. Set to a small
        value (e.g. 0.5) if you want a higher sampling rate.
    stop_event:
        Optional threading.Event to coordinate shutdown across workers. If not
        provided the worker manages its own private event.
    """

    name: str
    source: str | int | Path
    frame_queue: Queue
    interval: float = 1.0
    stop_event: threading.Event = field(default_factory=threading.Event)
    _thread: Optional[threading.Thread] = field(init=False, default=None)

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            LOGGER.debug("Video feed %s already running.", self.name)
            return

        LOGGER.info("Starting video feed worker for %s.", self.name)
        self._thread = threading.Thread(target=self._run, name=f"VideoFeed-{self.name}", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        LOGGER.info("Stopping video feed worker for %s.", self.name)
        self.stop_event.set()

    def join(self, timeout: Optional[float] = None) -> None:
        if self._thread:
            self._thread.join(timeout=timeout)

    # --------------------------------------------------------------------- #
    # Internal helpers
    # --------------------------------------------------------------------- #
    def _run(self) -> None:
        capture = cv2.VideoCapture(str(self.source))
        if not capture.isOpened():
            LOGGER.error("Unable to open video source %s.", self.source)
            return

        try:
            while not self.stop_event.is_set():
                ok, frame = capture.read()
                if not ok or frame is None:
                    LOGGER.warning("End of stream or read error on %s.", self.source)
                    break

                payload = {"camera": self.name, "frame": frame, "timestamp": time.time()}
                try:
                    self.frame_queue.put(payload, timeout=0.1)
                    LOGGER.debug("Enqueued frame from %s.", self.name)
                except Full:
                    LOGGER.warning("Frame queue full for %s – dropping frame.", self.name)

                # Sleep after enqueue to maintain sampling rate.
                self.stop_event.wait(self.interval)
        finally:
            capture.release()
            LOGGER.info("Video feed worker for %s exited.", self.name)


def spawn_video_feeds(
    feeds: dict[str, str | int | Path],
    frame_queue: Queue,
    interval: float = 1.0,
) -> list[VideoFeedWorker]:
    """
    Convenience helper to spin up multiple video feed workers.

    Parameters
    ----------
    feeds:
        Mapping of camera name to OpenCV-compatible source.
    frame_queue:
        Shared queue for frames.
    interval:
        Sampling interval for each worker.

    Returns
    -------
    list[VideoFeedWorker]
        A list of live workers (already started).
    """
    workers: list[VideoFeedWorker] = []
    for name, source in feeds.items():
        worker = VideoFeedWorker(name=name, source=source, frame_queue=frame_queue, interval=interval)
        worker.start()
        workers.append(worker)
    return workers

