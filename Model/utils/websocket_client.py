"""
WebSocket connector that streams model outputs to the backend server.
"""

from __future__ import annotations

import asyncio
import json
import logging
import threading
from dataclasses import dataclass, field
from queue import Empty, Queue
from typing import Any, Dict, Optional

try:
    import websockets  # type: ignore
except ImportError as exc:  # pragma: no cover - dependency check
    raise ImportError(
        "WebSocket support now relies on the `websockets` package. "
        "Install it with `pip install websockets`."
    ) from exc

LOGGER = logging.getLogger(__name__)


@dataclass
class ModelWebSocketClient:
    """
    Background worker that keeps a WebSocket connection alive and streams
    model outputs to the server defined in `Server/api/model_api.py`.
    """

    url: str
    reconnect_interval: float = 5.0
    send_queue: Queue = field(default_factory=Queue)
    _thread: Optional[threading.Thread] = field(init=False, default=None)
    _stop_event: threading.Event = field(default_factory=threading.Event)
    _loop: Optional[asyncio.AbstractEventLoop] = field(init=False, default=None)
    _ws: Optional[websockets.WebSocketClientProtocol] = field(init=False, default=None)

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_loop, name="ModelWebSocket", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._loop:
            self._loop.call_soon_threadsafe(lambda: None)
        if self._thread:
            self._thread.join(timeout=5)

    def send(self, payload: Dict[str, Any]) -> None:
        try:
            self.send_queue.put_nowait(payload)
        except Exception:  # pragma: no cover - queue unexpected error
            LOGGER.exception("Failed to enqueue payload for websocket transmission.")

    # ------------------------------------------------------------------ #
    def _run_loop(self) -> None:
        loop = asyncio.new_event_loop()
        self._loop = loop
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(self._main())
        finally:
            pending = asyncio.all_tasks(loop=loop)
            for task in pending:
                task.cancel()
            try:
                loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                loop.run_until_complete(loop.shutdown_asyncgens())
            finally:
                loop.close()

    async def _main(self) -> None:
        while not self._stop_event.is_set():
            try:
                LOGGER.info("Connecting to model WebSocket at %s", self.url)
                async with websockets.connect(self.url, ping_interval=20, ping_timeout=20) as ws:
                    self._ws = ws
                    LOGGER.info("Connected to model WebSocket.")
                    await self._drain_queue(ws)
            except asyncio.CancelledError:
                break
            except Exception:
                LOGGER.exception("WebSocket connection error. Retrying in %.1fs.", self.reconnect_interval)
            finally:
                self._ws = None
                if self._stop_event.wait(self.reconnect_interval):
                    break

    async def _drain_queue(self, ws: websockets.WebSocketClientProtocol) -> None:
        while not self._stop_event.is_set():
            message = await self._next_message()
            if message is None:
                continue
            try:
                await ws.send(json.dumps(message, default=self._serialize))
            except Exception:
                LOGGER.exception("Failed to send payload over websocket; requeuing.")
                self.send_queue.put(message)
                raise

    async def _next_message(self) -> Optional[Dict[str, Any]]:
        loop = self._loop
        if loop is None:
            await asyncio.sleep(0.1)
            return None
        return await loop.run_in_executor(None, self._queue_get)

    def _queue_get(self) -> Optional[Dict[str, Any]]:
        while not self._stop_event.is_set():
            try:
                return self.send_queue.get(timeout=0.5)
            except Empty:
                continue
        return None

    @staticmethod
    def _serialize(value: Any) -> Any:
        if isinstance(value, (set, tuple)):
            return list(value)
        return value

