from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.workspace_service import WorkspaceService
from app.services.graph_service import GraphService
from app.schemas.graph import GraphStateResponse
from app.websockets.connection_manager import ws_manager

router = APIRouter(prefix="/seed", tags=["Seed & Reset"])


@router.post("", response_model=GraphStateResponse)
@router.post("/{workspace_id}", response_model=GraphStateResponse)
async def seed_workspace(
    workspace_id: str = "apex-launch",
    db: AsyncSession = Depends(get_db)
):
    """
    Resets and pre-populates a rich 8-task sample workspace for demonstration.
    """
    await WorkspaceService.seed_sample_workspace(db, workspace_id)
    fresh_graph = await GraphService.get_graph_state(db, workspace_id)
    await ws_manager.broadcast_to_workspace(
        workspace_id,
        {"type": "workspace_reset", "data": fresh_graph.model_dump()}
    )
    return fresh_graph

