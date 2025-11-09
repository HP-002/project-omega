# Model Pipeline

This directory hosts the end-to-end computer-vision pipeline that ingests camera feeds, extracts configured regions of interest (ROIs), performs person detection with Ultralytics YOLO, determines area occupancy, and optionally streams live summaries to the backend via WebSocket.

## Directory Layout

- `main.py` – CLI entry point that wires together video capture, ROI extraction, inference, persistence, and WebSocket streaming. Reads overrides from environment variables (optionally via `.env`).
- `utils/` – Core pipeline components (`video_processor`, `image_processor`, `model`, `websocket_client`).
- `data/` – Sample media assets and ROI configuration (`roi.json`).
- `output/frames/` – Annotated frames written by the result handler.
- `yolo11x.pt`, `yolo12x.pt` – YOLO weights (latest pipeline uses `yolo12x.pt` by default).
- `.env.example` – Template for configuring runtime variables.
- `requirements.txt` – Locked dependency versions for the runtime environment.

## Prerequisites

- Python 3.11+ (tested with the versions compatible with the pinned `torch==2.9.0` and `ultralytics==8.3.226`).
- GPU optional. Set `YOLO_DEVICE` in `main.py` to `cuda:0` (or similar) when CUDA is available; leave as `None` for CPU.
- Install system packages required by OpenCV (platform-specific).

### Environment Setup

```shell
cd Model
python -m venv .venv
.venv\Scripts\activate  # Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

Ensure the YOLO weight file referenced in `main.py` exists (`yolo12x.pt` by default). You can swap in a different checkpoint by updating `YOLO_WEIGHTS_PATH` (either directly or via environment/config files described below).

## Pipeline Overview

The runtime flow is coordinated inside `main.py`:

```191:241:Model/main.py
def main() -> int:
    ...
    workers: list[VideoFeedWorker] = spawn_video_feeds(...)
    roi_processor = ROIImageProcessor(...)
    ws_client = ModelWebSocketClient(...)
    model = YoloModel(...)
    model_processor = ModelProcessor(...)
    ...
```

1. **Video feeds** (`VideoFeedWorker`) read each configured stream and push frames into a shared queue at `FRAME_INTERVAL` seconds.
2. **ROI processor** (`ROIImageProcessor`) crops the camera-specific ROIs from each frame, vertically stacks them, and forwards the composite image plus segment metadata.
3. **Model processor** (`ModelProcessor`) runs YOLO inference, counts person detections in each ROI segment, and builds `summary` + `occupancies` payloads.
4. **Result handler** saves annotated frames to `output/frames`, logs human-readable occupancy summaries, and (optionally) pushes updates over WebSocket.

All stages run on background threads, coordinated via bounded queues to avoid uncontrolled memory growth.

## Configuration

Key runtime knobs live near the top of `main.py` and can be overridden through environment variables or a local `.env` file (load order when present):

- `VIDEO_PATHS` (comma-separated list; numeric entries treated as webcam indices)
- `ROI_CONFIG_PATH`
- `OUTPUT_DIRECTORY`
- `YOLO_WEIGHTS_PATH`
- `YOLO_DEVICE`
- `MODEL_WS_URL`
- `FRAME_INTERVAL`
- `QUEUE_CAPACITY`

Defaults mirror the values bundled with the repository, but you can create an `.env` file (see the next section) to tailor deployments without editing code.

### .env Configuration

Copy the provided template and adjust as needed:

```shell
cp .env.example .env  # Windows PowerShell: Copy-Item .env.example .env
```

Fields left blank fall back to the defaults shown above. `VIDEO_PATHS` accepts relative paths (resolved against the `Model` directory) or integers such as `0` for webcams.

### ROI JSON Format

`data/roi.json` maps camera identifiers to ROI definitions. Each ROI contains the four corner points of the polygon, a capacity, and an optional friendly name. Example (truncated):

```json
{
  "PaulaPlaza_1": {
    "boxes": [
      {
        "name": "Zone A",
        "capacity": 3,
        "tl": [112, 284],
        "tr": [490, 270],
        "bl": [130, 540],
        "br": [520, 520]
      }
      // ... more boxes ...
    ]
  }
}
```

`ROIImageProcessor` converts each polygon into a bounding rectangle, crops that region, and records the segment metadata (index, height, width, y-offsets) used later for overlap checks.

## Running the Pipeline

1. Adjust `VIDEO_PATHS` and ROI definitions to match the cameras you plan to monitor.
2. (Optional) Update `MODEL_WS_URL` to point to your backend instance or set it to `None` if you only want local logging.
3. From the `Model` directory (with the virtual environment activated):

```shell
python main.py
```

Log output will list each camera’s occupancy summary. Annotated frames accumulate under `output/frames`. WebSocket delivery retries automatically on failures; check the logs for connection issues.

Press `Ctrl+C` to shut down gracefully. Threads respond to SIGINT/SIGTERM and flush queues before exiting.

## Data & Outputs

- **Input media**: Place sample clips under `data/videos/`. Matching still frames can be stored in `data/frames/` for debugging.
- **Outputs**: Saved frames are named `<camera>_<timestamp>.jpg` and include detection markers plus ROI status bands.
- **Backend integration**: Payloads sent to the server contain `summary`, `segments`, and per-ROI occupancy counts; see `ModelWebSocketClient` for the message schema.

## Extending the Model

- **Different detectors**: Implement `BaseModel.predict()` and supply the instance to `ModelProcessor`.
- **Custom result handling**: Swap out `create_result_handler` or augment it to push metrics, trigger alerts, etc.
- **Throughput tuning**: Increase queue sizes, adjust sampling intervals, or offload inference to GPU.

## Troubleshooting

- Missing dependencies: Re-run `pip install -r requirements.txt` inside the active virtual environment.
- No detections: Verify ROI polygons cover the relevant image regions and the YOLO weights are trained for your scenario.
- WebSocket failures: Confirm the backend endpoint is reachable; the client retries every `reconnect_interval` seconds.
- Performance bottlenecks: Lower `FRAME_INTERVAL`, reduce ROI counts, or resize input video streams.

## Licensing & Credits

- YOLO weights are provided for internal testing; ensure you have rights to deploy them in production.
- Ultralytics YOLO and OpenCV are licensed under their respective terms—review before redistribution.


