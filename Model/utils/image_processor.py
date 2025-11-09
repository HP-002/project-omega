"""
Image processor stage that consumes frames from the video feed queue, extracts
regions of interest (ROIs), and forwards concatenated ROI images to the model
stage.
"""

from __future__ import annotations

import json
import logging
import threading
from dataclasses import asdict, dataclass, field
from pathlib import Path
from queue import Empty, Full, Queue
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np

LOGGER = logging.getLogger(__name__)

RoiBox = Tuple[int, int, int, int]  # (x_min, y_min, x_max, y_max)


@dataclass(frozen=True)
class RoiDefinition:
    index: int
    box: RoiBox
    capacity: int
    name: str


@dataclass
class RoiPayload:
    definition: RoiDefinition
    image: np.ndarray


@dataclass(frozen=True)
class RoiSegmentMeta:
    index: int
    name: str
    capacity: int
    y_start: int
    y_end: int
    height: int
    width: int
    box: RoiBox


def _normalize_box(box: Dict[str, Sequence[int]]) -> RoiBox:
    """
    Convert the ROI definition from the JSON format into a bounding rectangle.
    """
    points = [box[key] for key in ("tl", "tr", "bl", "br") if key in box]
    if len(points) < 4:
        raise ValueError("ROI definition must include tl, tr, bl, br points.")
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    x_min, x_max = min(xs), max(xs)
    y_min, y_max = min(ys), max(ys)
    return x_min, y_min, x_max, y_max


def load_roi_config(path: str | Path) -> dict[str, list[RoiDefinition]]:
    """
    Load ROI definitions from a JSON file.
    """
    path = Path(path)
    with path.open("r", encoding="utf-8") as fh:
        raw = json.load(fh)

    rois: dict[str, list[RoiDefinition]] = {}
    for camera_name, payload in raw.items():
        definitions: list[RoiDefinition] = []
        for idx, box_payload in enumerate(payload.get("boxes", [])):
            bounds = _normalize_box(box_payload)
            capacity = int(box_payload.get("capacity", 0))
            name = box_payload.get("name") or f"ROI-{idx + 1}"
            definitions.append(
                RoiDefinition(
                    index=idx,
                    box=bounds,
                    capacity=capacity,
                    name=name,
                )
            )
        rois[camera_name] = definitions
    LOGGER.info("Loaded ROI configuration for %d cameras from %s.", len(rois), path)
    return rois


def concatenate_rois(payloads: Sequence[RoiPayload]) -> Optional[Tuple[np.ndarray, List[RoiSegmentMeta]]]:
    """
    Concatenate ROI crops vertically (one on top of another).
    """
    if not payloads:
        return None

    widths = [payload.image.shape[1] for payload in payloads]
    target_width = max(widths)

    padded: list[np.ndarray] = []
    segments: list[RoiSegmentMeta] = []
    current_y = 0

    for payload in payloads:
        img = payload.image
        height, width = img.shape[:2]
        if width != target_width:
            pad_left = (target_width - width) // 2
            pad_right = target_width - width - pad_left
            pad_spec = ((0, 0), (pad_left, pad_right), (0, 0))
            img = np.pad(img, pad_spec, constant_values=0)
        padded.append(img)

        segment = RoiSegmentMeta(
            index=payload.definition.index,
            name=payload.definition.name,
            capacity=payload.definition.capacity,
            y_start=current_y,
            y_end=current_y + img.shape[0],
            height=img.shape[0],
            width=img.shape[1],
            box=payload.definition.box,
        )
        segments.append(segment)
        current_y += img.shape[0]

    return np.vstack(padded), segments


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
    _rois: dict[str, list[RoiDefinition]] = field(init=False, default_factory=dict)

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
            roi_payloads = self._extract_rois(frame, rois)
            concatenated = concatenate_rois(roi_payloads)
            if concatenated is None:
                LOGGER.debug("Camera %s produced no ROI data.", camera)
                continue

            roi_image, segments = concatenated

            output_package = {
                "camera": camera,
                "timestamp": timestamp,
                "roi_image": roi_image,
                "roi_count": len(roi_payloads),
                "segments": [asdict(segment) for segment in segments],
            }
            try:
                self.output_queue.put(output_package, timeout=0.1)
                LOGGER.debug("Enqueued ROI image for camera %s.", camera)
            except Full:
                LOGGER.warning("Model queue is full – dropping ROI data for %s.", camera)

    def _extract_rois(self, frame: np.ndarray, rois: Sequence[RoiDefinition]) -> List[RoiPayload]:
        height, width = frame.shape[:2]
        extracted: list[RoiPayload] = []
        for definition in rois:
            x_min, y_min, x_max, y_max = definition.box
            x_min = max(0, min(width, x_min))
            x_max = max(0, min(width, x_max))
            y_min = max(0, min(height, y_min))
            y_max = max(0, min(height, y_max))
            if x_min >= x_max or y_min >= y_max:
                LOGGER.debug("Skipping invalid ROI box %s.", definition.box)
                continue
            roi_frame = frame[y_min:y_max, x_min:x_max]
            if roi_frame.size == 0:
                LOGGER.debug("Empty ROI for box %s.", definition.box)
                continue
            extracted.append(RoiPayload(definition=definition, image=roi_frame))
        return extracted

