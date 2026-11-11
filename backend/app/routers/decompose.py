import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.task import Task, TaskDependency
from app.schemas.decompose import DecomposeRequest, DecomposeResponse
from app.ai.decomposer import BriefDecomposer
from app.ai.embeddings import generate_embedding
from app.services.workspace_service import WorkspaceService
from app.services.graph_service import GraphService
from app.websockets.connection_manager import ws_manager

router = APIRouter(prefix="/decompose", tags=["Brief Decomposition"])


@router.post("", response_model=DecomposeResponse)
async def decompose_brief(
    request: DecomposeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Module A: Ingests raw markdown, PRD drafts, or unstructured briefs,
    deconstructs into tasks categorized across domains, and builds a directed graph.
    """
    workspace_id = request.workspace_id or "default-workspace"
    workspace = await WorkspaceService.get_or_create_workspace(
        db, workspace_id, request.workspace_name
    )

    # 1. AI / Heuristic decomposition
    extracted_tasks, extracted_deps = await BriefDecomposer.decompose_brief(
        request.brief_text, workspace_id
    )

    if not extracted_tasks:
        raise HTTPException(status_code=400, detail="Could not extract actionable deliverables from brief.")

    # 2. Clear previous and save fresh tasks
    existing_tasks = await db.execute(select(Task).where(Task.workspace_id == workspace_id))
    for t in existing_tasks.scalars().all():
        await db.delete(t)
    existing_deps = await db.execute(select(TaskDependency).where(TaskDependency.workspace_id == workspace_id))
    for d in existing_deps.scalars().all():
        await db.delete(d)
    await db.commit()

    # 3. Insert new tasks with semantic embeddings
    for t in extracted_tasks:
        emb = await generate_embedding(f"{t.title} {t.description}")
        db_task = Task(
            id=t.id,
            workspace_id=workspace_id,
            title=t.title,
            description=t.description,
            domain=t.domain,
            status="on_track",
            owner=t.owner,
            duration_days=t.duration_days,
            cumulative_delay_days=0,
            embedding=json.dumps(emb)
        )
        db.add(db_task)

    # 4. Insert dependencies
    for d in extracted_deps:
        dep_id = f"DEP-{str(uuid.uuid4())[:6].upper()}"
        db_dep = TaskDependency(
            id=dep_id,
            workspace_id=workspace_id,
            source_task_id=d.source_task_id,
            target_task_id=d.target_task_id,
            rationale=d.rationale,
            impact_type="blocking"
        )
        db.add(db_dep)

    await db.commit()

    # 5. Fetch calculated React Flow graph and broadcast
    graph_state = await GraphService.get_graph_state(db, workspace_id)
    await ws_manager.broadcast_to_workspace(
        workspace_id,
        {"type": "brief_decomposed", "data": graph_state.model_dump()}
    )

    return DecomposeResponse(
        workspace_id=workspace_id,
        workspace_name=workspace.name,
        tasks=extracted_tasks,
        dependencies=extracted_deps,
        nodes=graph_state.nodes,
        edges=graph_state.edges,
        total_tasks=len(extracted_tasks),
        critical_path_duration_days=graph_state.metrics.critical_path_duration_days
    )
