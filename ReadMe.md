# CrowdSense – Quickstart

CrowdSense is composed of three cooperating services:

- **Server (`Server/`)**: FastAPI backend that accepts inference updates from the model, transforms them, and streams simplified occupancy payloads to clients over WebSockets.
- **App (`App/`)**: Expo React Native front end that visualizes live occupancy data, offering list and map modes with favorites and theming.
- **Model (`Model/`)**: Computer-vision pipeline built around Ultralytics YOLO that ingests camera feeds, evaluates occupancy within configured regions of interest, and pushes summaries to the server.

## Run Order

1. **Start the server (terminal #1)**
   - Open a terminal and navigate to `Server/`.
   - Create/activate a Python 3.10+ virtual environment.
   - Install dependencies: `pip install -r requirements.txt`.
   - (Optional) copy `.env.example` to `.env` and adjust environment variables, then initialize the database if needed.
   - Launch the FastAPI service with reload: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`.

2. **Start the app (terminal #2)**
   - In a new terminal, change directory to `App/`.
   - Ensure Node.js ≥ 18 is installed, then install packages: `npm install`.
   - Update `config/websocket.js` so `WS_URL` points to the running server (e.g., `ws://<server-ip>:8000/client/ws/connect`).
   - Start Metro: `npm run start` (or `npx expo start`), then open the Expo Go client or simulator to load the app.

3. **Start the model (terminal #3)**
   - Open a third terminal and move to `Model/`.
   - Create/activate a Python 3.11+ virtual environment.
   - Install dependencies: `pip install -r requirements.txt` (after `pip install --upgrade pip` if desired).
   - Copy `.env.example` to `.env`, configure video paths, ROI definitions, and set `MODEL_WS_URL` to `ws://<server-ip>:8000/model/ws/connect`.
   - Run the pipeline: `python main.py`.

With all three components running, the model streams occupancy summaries to the server, the server broadcasts updates, and the app renders live crowd insights.

