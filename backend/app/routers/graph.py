from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.graph import GraphStateResponse, NodeUpdatePayload
from app.services.graph_service import GraphService
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/graph", tags=["Graph & React Flow"])


@router.get("/{workspace_id}", response_model=GraphStateResponse)
async def get_graph(
    workspace_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns full React Flow nodes, directed edges, critical path,
    and workspace metrics for center canvas rendering.
    """
    await WorkspaceService.get_or_create_workspace(db, workspace_id)
    return await GraphService.get_graph_state(db, workspace_id)


@router.post("/{workspace_id}/node/{node_id}", response_model=GraphStateResponse)
async def update_node(
    workspace_id: str,
    node_id: str,
    payload: NodeUpdatePayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Manually overrides task node parameters and recalculates risk cascades.
    """
    try:
        return await GraphService.update_node_and_propagate(db, workspace_id, node_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
