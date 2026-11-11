import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Mapping from workspace_id to set of active WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, workspace_id: str, websocket: WebSocket):
        await websocket.accept()
        if workspace_id not in self.active_connections:
            self.active_connections[workspace_id] = set()
        self.active_connections[workspace_id].add(websocket)
        logger.info(f"WebSocket client connected to workspace: {workspace_id} (Total: {len(self.active_connections[workspace_id])})")

    def disconnect(self, workspace_id: str, websocket: WebSocket):
        if workspace_id in self.active_connections:
            self.active_connections[workspace_id].discard(websocket)
            if not self.active_connections[workspace_id]:
                del self.active_connections[workspace_id]
        logger.info(f"WebSocket client disconnected from workspace: {workspace_id}")

    async def broadcast_to_workspace(self, workspace_id: str, message: Dict[str, Any]):
        if workspace_id not in self.active_connections:
            return

        payload = json.dumps(message)
        dead_sockets = set()

        for connection in list(self.active_connections[workspace_id]):
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send to socket in {workspace_id}: {e}")
                dead_sockets.add(connection)

        for dead in dead_sockets:
            self.disconnect(workspace_id, dead)


ws_manager = ConnectionManager()

