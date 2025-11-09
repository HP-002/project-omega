# Project Omega Server

## Overview

This FastAPI service sits between the computer-vision model pipeline and
real-time client applications. It provides:

- WebSocket ingress for model inference payloads.
- WebSocket egress for broadcasting simplified occupancy updates to clients.
- A health-check REST endpoint for service discovery.
- A relational data layer (SQLAlchemy) prepared for persisting model output.

The codebase is organized so that model producers push rich JSON payloads to
`/model/ws/connect`, the payloads are transformed in `utils/data_handler.py`,
and subscribed clients receive updates over `/client/ws/connect`.

## Project Structure

- `api/` – FastAPI routers for model-facing, client-facing, and discovery endpoints.
- `database/` – SQLAlchemy engine setup, ORM models, and CRUD helpers.
- `schemas/` – Pydantic models describing payload contracts.
- `utils/` – Shared utilities including the WebSocket connection manager and data transformer.
- `main.py` – FastAPI app factory and Uvicorn entry point.

## Requirements

- Python 3.10+ (FastAPI and dependencies rely on modern typing features).
- A database reachable by SQLAlchemy (SQLite, PostgreSQL, etc.).
- Optional: `uvicorn[standard]` for local development hot-reload (already listed in `requirements.txt`).

Install dependencies:

```
python -m venv .venv
.venv\Scripts\activate        # on Windows
source .venv/bin/activate     # on macOS/Linux
pip install -r requirements.txt
```

## Configuration

Environment variables are loaded from `.env` if present. Copy the example file
and adjust the values to your environment:

```
cp .env.example .env
```

Required variables:

- `DATABASE_URL` – SQLAlchemy connection string. The example defaults to SQLite
  in the project root (`sqlite:///./omega.db`). Replace with your production
  database URI when deploying.

## Database Setup

The ORM models in `database/models.py` define `Location`, `Camera`, and
`ModelData`. To initialise the schema for SQLite/local development, run once:

```python
python
>>> from database.connection import Base, engine
>>> Base.metadata.create_all(bind=engine)
```

The CRUD helpers in `database/crud.py` handle upserting locations and cameras
when new model payloads arrive.

## Running the Server

Start the development server with auto-reload:

```
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Or use the module entry point:

```
python main.py
```

The API documentation is available at `http://localhost:8000/docs` when the
server is running.

## API Surface

- `GET /discover/health` – Simple health check returning
  `{"status": "ok", "message": "Server is running!"}`.
- `GET /model/count` – Returns `{ "count": <int> }` representing active model
  websocket connections.
- `WS /model/ws/connect` – Accepts JSON payloads from the inference service.
  Expected structure includes:
  - `camera` (str): camera identifier mapped to a location name.
  - `timestamp` (ISO string): capture timestamp.
  - `summary` (object): contains `total_people`, `free`, and `occupied` lists that
    drive occupancy calculations.
- `WS /client/ws/connect` – Subscribes clients to occupancy updates. Clients do
  not need to send messages after connecting.

### Data Flow

1. Model connects to `/model/ws/connect` and streams inference results.
2. `DataHandler.transform_to_client_data` maps camera IDs to friendly location
   names and computes occupancy percentages.
3. Connected clients receive the transformed payload via `ConnectionManager.broadcast`.
4. (Optional) Persistence: `database/crud.save_model_data` is ready to store the
   payload if enabled within `DataHandler.handle_data`.

## Development Tips

- Update `utils/data_handler.py` to enable persistence by wiring the provided
  CRUD helpers and schemas.
- Keep the `places` mapping in sync with valid camera IDs; mismatches will raise
  key errors.
- When switching databases, ensure the `DATABASE_URL` connection string matches
  the target driver (e.g. `postgresql+psycopg2://...`).
- Monitor websocket connection counts via `GET /model/count` during load tests.

