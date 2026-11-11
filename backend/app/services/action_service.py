import datetime
import json
import logging
import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.action import AgentAction, AuditLog
from app.models.task import Task, TaskDependency
from app.graph.engine import GraphEngine
from app.schemas.action import ActionResponse, AuditLogItem
from app.websockets.connection_manager import ws_manager

logger = logging.getLogger(__name__)


class ActionService:
    @staticmethod
    async def list_actions(db: AsyncSession, workspace_id: str) -> List[ActionResponse]:
        query = (
            select(AgentAction, Task.title.label("task_title"))
            .outerjoin(Task, AgentAction.task_id == Task.id)
            .where(AgentAction.workspace_id == workspace_id)
            .order_by(desc(AgentAction.created_at))
        )
        res = await db.execute(query)
        actions = []
        for action, task_title in res.all():
            actions.append(
                ActionResponse(
                    id=action.id,
                    workspace_id=action.workspace_id,
                    task_id=action.task_id,
                    task_title=task_title,
                    title=action.title,
                    action_type=action.action_type,
                    status=action.status,
                    proposed_shift_days=action.proposed_shift_days,
                    rationale=action.rationale,
                    impact_summary=action.impact_summary,
                    created_at=action.created_at,
                    resolved_at=action.resolved_at,
                )
            )
        return actions

    @staticmethod
    async def list_audit_logs(db: AsyncSession, workspace_id: str) -> List[AuditLogItem]:
        query = (
            select(AuditLog)
            .where(AuditLog.workspace_id == workspace_id)
            .order_by(desc(AuditLog.timestamp))
            .limit(50)
        )
        res = await db.execute(query)
        logs = []
        for log in res.scalars().all():
            logs.append(
                AuditLogItem(
                    id=log.id,
                    workspace_id=log.workspace_id,
                    action_id=log.action_id,
                    actor=log.actor,
                    decision=log.decision,
                    details=log.details,
                    timestamp=log.timestamp,
                )
            )
        return logs

    @classmethod
    async def create_action_proposal(
        cls,
        db: AsyncSession,
        workspace_id: str,
        task_id: str,
        title: str,
        action_type: str,
        proposed_shift_days: int,
        rationale: str,
        impact_summary: str,
        payload: Dict[str, Any]
    ) -> AgentAction:
        action_id = f"ACT-{str(uuid.uuid4())[:8].upper()}"
        action = AgentAction(
            id=action_id,
            workspace_id=workspace_id,
            task_id=task_id,
            title=title,
            action_type=action_type,
            status="pending",
            proposed_shift_days=proposed_shift_days,
            rationale=rationale,
            impact_summary=impact_summary,
            proposed_payload=json.dumps(payload),
        )
        db.add(action)
        await db.commit()
        await db.refresh(action)

        # Broadcast proposed action via WebSocket
        await ws_manager.broadcast_to_workspace(
            workspace_id,
            {
                "type": "agent_action_created",
                "data": {
                    "id": action.id,
                    "title": action.title,
                    "action_type": action.action_type,
                    "status": "pending",
                    "proposed_shift_days": action.proposed_shift_days,
                    "rationale": action.rationale,
                    "impact_summary": action.impact_summary,
                    "task_id": action.task_id,
                }
            }
        )
        return action

    @classmethod
    async def approve_action(
        cls,
        db: AsyncSession,
        workspace_id: str,
        action_id: str,
        actor: str = "Human Operator",
        note: Optional[str] = None
    ) -> Dict[str, Any]:
        res = await db.execute(
            select(AgentAction).where(AgentAction.workspace_id == workspace_id, AgentAction.id == action_id)
        )
        action = res.scalar_one_or_none()
        if not action:
            raise ValueError(f"Action {action_id} not found")
        if action.status != "pending":
            return {"message": f"Action is already {action.status}", "status": action.status}

        action.status = "approved"
        action.resolved_at = datetime.datetime.now(datetime.timezone.utc)

        applied_changes = {}
        if action.proposed_payload:
            try:
                payload_data = json.loads(action.proposed_payload)
                applied_changes = payload_data
                
                # If the action shifts or resolves a task
                if action.task_id:
                    task_res = await db.execute(
                        select(Task).where(Task.workspace_id == workspace_id, Task.id == action.task_id)
                    )
                    task = task_res.scalar_one_or_none()
                    if task:
                        # Reset blocked status to on_track or at_risk with approved schedule extension
                        if payload_data.get("resolve_blocker"):
                            task.status = "on_track"
                            task.delay_reason = f"Blocker mitigated by human approval ({action.title})"
                        if payload_data.get("extend_duration"):
                            task.duration_days += payload_data.get("extend_duration", 0)
            except Exception as e:
                logger.error(f"Error applying action payload: {e}")

        # Record audit log
        audit = AuditLog(
            id=f"AUD-{str(uuid.uuid4())[:8].upper()}",
            workspace_id=workspace_id,
            action_id=action.id,
            actor=actor,
            decision="approved",
            details=json.dumps({"action_title": action.title, "note": note, "applied": applied_changes}),
        )
        db.add(audit)
        await db.commit()

        # Recalculate graph and propagate resolution
        from app.services.graph_service import GraphService
        fresh_state = await GraphService.get_graph_state(db, workspace_id)

        # Broadcast approval and fresh graph
        await ws_manager.broadcast_to_workspace(
            workspace_id,
            {
                "type": "action_approved",
                "action_id": action.id,
                "actor": actor,
                "message": f"Action '{action.title}' approved by {actor}.",
                "fresh_graph": fresh_state.model_dump(),
            }
        )

        return {
            "action_id": action.id,
            "status": "approved",
            "actor": actor,
            "applied_changes": applied_changes,
            "message": f"Successfully approved and executed action: {action.title}"
        }

    @classmethod
    async def reject_action(
        cls,
        db: AsyncSession,
        workspace_id: str,
        action_id: str,
        actor: str = "Human Operator",
        note: Optional[str] = None
    ) -> Dict[str, Any]:
        res = await db.execute(
            select(AgentAction).where(AgentAction.workspace_id == workspace_id, AgentAction.id == action_id)
        )
        action = res.scalar_one_or_none()
        if not action:
            raise ValueError(f"Action {action_id} not found")
        if action.status != "pending":
            return {"message": f"Action is already {action.status}", "status": action.status}

        action.status = "rejected"
        action.resolved_at = datetime.datetime.now(datetime.timezone.utc)

        audit = AuditLog(
            id=f"AUD-{str(uuid.uuid4())[:8].upper()}",
            workspace_id=workspace_id,
            action_id=action.id,
            actor=actor,
            decision="rejected",
            details=json.dumps({"action_title": action.title, "note": note}),
        )
        db.add(audit)
        await db.commit()

        await ws_manager.broadcast_to_workspace(
            workspace_id,
            {
                "type": "action_rejected",
                "action_id": action.id,
                "actor": actor,
                "message": f"Action '{action.title}' was dismissed by {actor}.",
            }
        )

        return {
            "action_id": action.id,
            "status": "rejected",
            "actor": actor,
            "applied_changes": {},
            "message": f"Action {action.title} dismissed."
        }

