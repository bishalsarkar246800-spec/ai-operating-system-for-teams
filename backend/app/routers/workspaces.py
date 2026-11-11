import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.workspace import Workspace
from app.models.task import Task
from app.services.workspace_service import WorkspaceService
from app.services.graph_service import GraphService

router = APIRouter(prefix="/workspaces", tags=["Workspaces & Multi-Tenancy"])


class WorkspaceItem(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    total_tasks: int = 0
    created_at: datetime.datetime


class CreateWorkspaceRequest(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    seed_sample: bool = False


@router.get("", response_model=List[WorkspaceItem])
async def list_workspaces(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Workspace).order_by(Workspace.created_at))
    workspaces = res.scalars().all()
    
    result = []
    for w in workspaces:
        t_count_res = await db.execute(
            select(func.count(Task.id)).where(Task.workspace_id == w.id)
        )
        task_count = t_count_res.scalar_one() or 0
        result.append(
            WorkspaceItem(
                id=w.id,
                name=w.name,
                description=w.description,
                total_tasks=task_count,
                created_at=w.created_at,
            )
        )
    return result


@router.post("", response_model=WorkspaceItem)
async def create_workspace(
    payload: CreateWorkspaceRequest,
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(Workspace).where(Workspace.id == payload.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Workspace ID already exists.")

    workspace = Workspace(
        id=payload.id,
        name=payload.name,
        description=payload.description or "Collaborative multi-tenant workspace."
    )
    db.add(workspace)
    await db.commit()
    await db.refresh(workspace)

    if payload.seed_sample:
        await WorkspaceService.seed_sample_workspace(db, workspace.id)

    return WorkspaceItem(
        id=workspace.id,
        name=workspace.name,
        description=workspace.description,
        total_tasks=8 if payload.seed_sample else 0,
        created_at=workspace.created_at,
    )

