import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import settings
from app.database import init_db, AsyncSessionLocal
from app.routers import (
    graph_router,
    decompose_router,
    events_router,
    actions_router,
    seed_router,
)
from app.websockets.connection_manager import ws_manager
from app.services.workspace_service import WorkspaceService
from app.services.graph_service import GraphService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_teams_os")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schemas...")
    await init_db()

    # Pre-seed default demo workspace if empty
    async with AsyncSessionLocal() as session:
        try:
            state = await GraphService.get_graph_state(session, "apex-launch")
            if not state.nodes:
                logger.info("Apex workspace is empty. Seeding rich demo DAG...")
                await WorkspaceService.seed_sample_workspace(session, "apex-launch")
        except Exception as e:
            logger.warning(f"Initial seed check warning: {e}")

    logger.info("Backend service startup completed.")
    yield
    logger.info("Backend shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-tenant workspace platform transforming unstructured briefs and team activity into dependency graphs, surfacing downstream risk, and executing human-approved agent actions.",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers under /api
app.include_router(graph_router, prefix=settings.API_V1_STR)
app.include_router(decompose_router, prefix=settings.API_V1_STR)
app.include_router(events_router, prefix=settings.API_V1_STR)
app.include_router(actions_router, prefix=settings.API_V1_STR)
app.include_router(seed_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get("/")
async def root():
    return {
        "message": "AI Operating System for Teams API is active",
        "docs": "/docs",
        "health": "/health",
    }


# WebSocket endpoint for real-time bidirectional events
@app.websocket("/ws/{workspace_id}")
async def websocket_endpoint(websocket: WebSocket, workspace_id: str):
    await ws_manager.connect(workspace_id, websocket)
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection_established",
            "workspace_id": workspace_id,
            "message": f"Connected to real-time risk stream for {workspace_id}"
        })
        while True:
            data = await websocket.receive_text()
            # Handle client-originated ping or event requests
            logger.debug(f"Received client message in {workspace_id}: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(workspace_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error in {workspace_id}: {e}")
        ws_manager.disconnect(workspace_id, websocket)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
