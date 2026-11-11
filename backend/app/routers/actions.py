from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.action import AgentAction
from app.schemas.action import (
    ActionResponse,
    ActionDecisionRequest,
    ActionDecisionResponse,
    AuditLogItem,
)
from app.services.action_service import ActionService

router = APIRouter(prefix="/actions", tags=["Human-in-the-Loop Actions"])


@router.get("", response_model=List[ActionResponse])
@router.get("/{workspace_id}", response_model=List[ActionResponse])
async def list_actions(
    workspace_id: str = "apex-launch",
    db: AsyncSession = Depends(get_db)
):
    return await ActionService.list_actions(db, workspace_id)


@router.get("/{workspace_id}/audit", response_model=List[AuditLogItem])
async def list_audit_logs(
    workspace_id: str = "apex-launch",
    db: AsyncSession = Depends(get_db)
):
    return await ActionService.list_audit_logs(db, workspace_id)


@router.post("/{action_id}/approve", response_model=ActionDecisionResponse)
@router.post("/{workspace_id}/{action_id}/approve", response_model=ActionDecisionResponse)
async def approve_action(
    action_id: str,
    payload: ActionDecisionRequest = ActionDecisionRequest(),
    workspace_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Module D: Approves an AI-proposed remedial intervention with audit logging.
    """
    if not workspace_id:
        # Lookup workspace from action_id
        res = await db.execute(select(AgentAction).where(AgentAction.id == action_id))
        action = res.scalar_one_or_none()
        if not action:
            raise HTTPException(status_code=404, detail=f"Action {action_id} not found.")
        workspace_id = action.workspace_id

    try:
        result = await ActionService.approve_action(
            db=db,
            workspace_id=workspace_id,
            action_id=action_id,
            actor=payload.actor,
            note=payload.note
        )
        return ActionDecisionResponse(
            action_id=result["action_id"],
            status=result["status"],
            actor=result["actor"],
            applied_changes=result["applied_changes"],
            message=result["message"]
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{action_id}/reject", response_model=ActionDecisionResponse)
@router.post("/{workspace_id}/{action_id}/reject", response_model=ActionDecisionResponse)
async def reject_action(
    action_id: str,
    payload: ActionDecisionRequest = ActionDecisionRequest(),
    workspace_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Module D: Rejects/dismisses an AI-proposed action with audit logging.
    """
    if not workspace_id:
        res = await db.execute(select(AgentAction).where(AgentAction.id == action_id))
        action = res.scalar_one_or_none()
        if not action:
            raise HTTPException(status_code=404, detail=f"Action {action_id} not found.")
        workspace_id = action.workspace_id

    try:
        result = await ActionService.reject_action(
            db=db,
            workspace_id=workspace_id,
            action_id=action_id,
            actor=payload.actor,
            note=payload.note
        )
        return ActionDecisionResponse(
            action_id=result["action_id"],
            status=result["status"],
            actor=result["actor"],
            applied_changes=result["applied_changes"],
            message=result["message"]
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
