from __future__ import annotations

from fastapi import FastAPI

from api.model_api import router as model_router
from api.client_api import router as client_router
from api.discover import router as discover_router


def create_app() -> FastAPI:
    app = FastAPI(title="Project Omega Server", version="0.1.0")
    app.include_router(model_router)
    app.include_router(client_router)
    app.include_router(discover_router)
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
