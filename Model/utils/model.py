"""
Model processing stage that consumes ROI images and runs inference with YOLO.
"""

from __future__ import annotations

import logging
import threading
from dataclasses import dataclass, field
from pathlib import Path
from queue import Empty, Queue
from typing import Callable, Optional, Sequence

import numpy as np

LOGGER = logging.getLogger(__name__)

try:
    from ultralytics import YOLO  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    YOLO = None  # type: ignore


class BaseModel:
    """
    Minimal interface for inference models.
    """

    def predict(self, image: np.ndarray) -> dict:
        raise NotImplementedError


class DummyModel(BaseModel):
    """
    Fallback model used when a real detector is not supplied.
    """

    def predict(self, image: np.ndarray) -> dict:
        height, width = image.shape[:2]
        return {
            "detections": [
                {
                    "label": "roi",
                    "confidence": 0.5,
                    "box": [0, 0, width, height],
                }
            ],
            "shape": (height, width),
        }


class YoloModel(BaseModel):
    """
    Wrapper around an Ultralytics YOLO model.
    """

    def __init__(self, weights: str | Path, device: str | None = None):
        if YOLO is None:
            raise ImportError(
                "Ultralytics YOLO is not installed. Install it with `pip install ultralytics`."
            )

        weights_path = Path(weights)
        if not weights_path.exists():
            raise FileNotFoundError(f"YOLO weights not found at: {weights_path}")

        self.weights_path = weights_path
        self.device = device
        self.model = YOLO(str(weights_path))

    def predict(self, image: np.ndarray) -> dict:
        results = self.model.predict(
            image,
            device=self.device,
            verbose=False,
        )

        detections = []
        if results:
            result = results[0]
            names = getattr(result, "names", None) or getattr(self.model.model, "names", {})
            boxes: Sequence = getattr(result, "boxes", [])

            for box in boxes:
                xyxy = box.xyxy[0].tolist()
                conf = float(box.conf[0]) if hasattr(box, "conf") else None
                cls_id = int(box.cls[0]) if hasattr(box, "cls") else None
                label = None
                if cls_id is not None and names:
                    label = names.get(cls_id, str(cls_id))

                detections.append(
                    {
                        "label": label,
                        "confidence": conf,
                        "box": xyxy,
                    }
                )

        return {"detections": detections}


ResultHandler = Callable[[dict, np.ndarray], None]


@dataclass
class ModelProcessor:
    """
    Thread that runs inference on ROI images received from the image stage.
    """

    input_queue: Queue
    model: BaseModel | None = None
    poll_timeout: float = 0.5
    result_handler: ResultHandler | None = None
    stop_event: threading.Event = field(default_factory=threading.Event)
    _thread: Optional[threading.Thread] = field(init=False, default=None)

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            LOGGER.debug("Model processor already running.")
            return

        LOGGER.info("Starting model processor.")
        self._thread = threading.Thread(target=self._run, name="ModelProcessor", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        LOGGER.info("Stopping model processor.")
        self.stop_event.set()

    def join(self, timeout: Optional[float] = None) -> None:
        if self._thread:
            self._thread.join(timeout=timeout)

    # ------------------------------------------------------------------ #
    def _run(self) -> None:
        model = self.model or DummyModel()
        while not self.stop_event.is_set():
            try:
                package = self.input_queue.get(timeout=self.poll_timeout)
            except Empty:
                continue

            roi_image = package.get("roi_image")
            camera = package.get("camera")
            timestamp = package.get("timestamp")

            inference = model.predict(roi_image)
            result = {
                "camera": camera,
                "timestamp": timestamp,
                "inference": inference,
            }

            if self.result_handler:
                try:
                    self.result_handler(result, roi_image)
                except Exception:  # pragma: no cover - downstream handler bug
                    LOGGER.exception("Error while handling inference result.")
            else:
                detections = inference.get("detections", [])
                LOGGER.info(
                    "Inference result for %s (timestamp=%s): %d detections",
                    camera,
                    timestamp,
                    len(detections),
                )

