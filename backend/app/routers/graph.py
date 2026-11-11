import json
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.task import Task, TaskDependency
from app.schemas.graph import GraphStateResponse, NodeUpdatePayload
from app.services.graph_service import GraphService
from app.services.workspace_service import WorkspaceService
from app.ai.embeddings import generate_embedding
from app.websockets.connection_manager import ws_manager

router = APIRouter(prefix="/graph", tags=["Graph & React Flow"])


class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = None
    domain: str = "Engineering"
    owner: Optional[str] = "Unassigned"
    duration_days: int = 3
    depends_on_task_id: Optional[str] = None


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


@router.post("/{workspace_id}/task", response_model=GraphStateResponse)
async def create_task(
    workspace_id: str,
    payload: CreateTaskRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a single task manually in any workspace, optionally linking to a parent dependency.
    """
    await WorkspaceService.get_or_create_workspace(db, workspace_id)

    # Generate unique ID scoped by workspace prefix
    count_res = await db.execute(
        select(func.count(Task.id)).where(Task.workspace_id == workspace_id)
    )
    task_num = (count_res.scalar_one() or 0) + 1
    import hashlib
    short_hash = hashlib.md5(workspace_id.encode()).hexdigest()[:4].upper()
    clean = "".join(c for c in workspace_id if c.isalnum())[:3].upper() or "WS"
    prefix = f"{clean}{short_hash}" if workspace_id != "apex-launch" else "TASK"
    task_id = f"{prefix}-TASK-{task_num:02d}"

    # Guard against global primary key collision
    while True:
        existing = await db.execute(select(Task.id).where(Task.id == task_id))
        if not existing.scalar_one_or_none():
            break
        task_num += 1
        task_id = f"{prefix}-TASK-{task_num:02d}"

    # Generate embedding
    emb = await generate_embedding(f"{payload.title} {payload.description or ''}")

    new_task = Task(
        id=task_id,
        workspace_id=workspace_id,
        title=payload.title,
        description=payload.description or f"Deliverable for {payload.title}",
        domain=payload.domain,
        owner=payload.owner or "Unassigned",
        duration_days=payload.duration_days,
        status="on_track",
        cumulative_delay_days=0,
        embedding=json.dumps(emb),
        position_x=80.0 + ((task_num - 1) % 4) * 340.0,
        position_y=80.0 + ((task_num - 1) // 4) * 180.0,
    )
    db.add(new_task)

    # If dependency specified
    if payload.depends_on_task_id:
        parent_res = await db.execute(
            select(Task).where(
                Task.workspace_id == workspace_id,
                Task.id == payload.depends_on_task_id
            )
        )
        if parent_res.scalar_one_or_none():
            dep = TaskDependency(
                id=f"DEP-{str(uuid.uuid4())[:6].upper()}",
                workspace_id=workspace_id,
                source_task_id=payload.depends_on_task_id,
                target_task_id=task_id,
                rationale=f"Prerequisite link to {task_id}",
                impact_type="blocking",
            )
            db.add(dep)

    await db.commit()

    fresh_state = await GraphService.get_graph_state(db, workspace_id)
    await ws_manager.broadcast_to_workspace(
        workspace_id,
        {"type": "graph_updated", "data": fresh_state.model_dump()}
    )
    return fresh_state
