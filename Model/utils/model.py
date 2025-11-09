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
                        "class_id": cls_id,
                        "confidence": conf,
                        "box": xyxy,
                    }
                )

        return {"detections": detections}


ResultHandler = Callable[[dict, np.ndarray], None]

PERSON_LABELS = {"person"}
PERSON_CLASS_IDS = {0}


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
            segments = package.get("segments", [])

            inference = model.predict(roi_image)
            detections = inference.get("detections", [])
            occupancies = self._calculate_occupancy(segments, detections)
            free = [entry["name"] for entry in occupancies if entry["status"] == "free"]
            occupied = [entry["name"] for entry in occupancies if entry["status"] == "occupied"]
            summary = {
                "total_people": sum(entry["count"] for entry in occupancies),
                "free": free,
                "occupied": occupied,
            }

            result = {
                "camera": camera,
                "timestamp": timestamp,
                "inference": inference,
                "segments": segments,
                "occupancies": occupancies,
                "summary": summary,
            }

            if self.result_handler:
                try:
                    self.result_handler(result, roi_image)
                except Exception:  # pragma: no cover - downstream handler bug
                    LOGGER.exception("Error while handling inference result.")
            else:
                LOGGER.info(
                    "Inference result for %s (timestamp=%s): free=%s occupied=%s total_people=%s",
                    camera,
                    timestamp,
                    summary["free"],
                    summary["occupied"],
                    summary["total_people"],
                )

    @staticmethod
    def _is_person_detection(detection: dict) -> bool:
        label = detection.get("label")
        if label and str(label).lower() in PERSON_LABELS:
            return True
        class_id = detection.get("class_id")
        return class_id in PERSON_CLASS_IDS

    def _calculate_occupancy(
        self,
        segments: Sequence[dict],
        detections: Sequence[dict],
    ) -> list[dict]:
        counts: dict[int, int] = {seg["index"]: 0 for seg in segments}
        for detection in detections:
            if not self._is_person_detection(detection):
                continue
            box = detection.get("box")
            if not box or len(box) < 4:
                continue
            y_center = (box[1] + box[3]) / 2
            for segment in segments:
                if segment["y_start"] <= y_center < segment["y_end"]:
                    counts[segment["index"]] += 1
                    break

        occupancies: list[dict] = []
        for segment in segments:
            capacity = segment.get("capacity", 0)
            count = counts.get(segment["index"], 0)
            status = "occupied" if capacity and count > capacity else "free"
            occupancies.append(
                {
                    "index": segment["index"],
                    "name": segment.get("name", f"ROI-{segment['index'] + 1}"),
                    "capacity": capacity,
                    "count": count,
                    "status": status,
                }
            )
        return occupancies

