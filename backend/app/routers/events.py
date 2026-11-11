import datetime
import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.task import Task, TaskDependency
from app.models.event import WorkspaceEvent
from app.schemas.event import IngestEventRequest, IngestEventResponse, EventItem, AffectedNodeImpact
from app.ai.event_analyzer import EventAnalyzer
from app.graph.engine import GraphEngine
from app.services.action_service import ActionService
from app.services.graph_service import GraphService
from app.websockets.connection_manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["Events & Team Activity"])


@router.post("/ingest", response_model=IngestEventResponse)
async def ingest_event(
    request: IngestEventRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Module B & C: Ingests unstructured team chat or activity, matches task node
    via hybrid semantic search, assesses delay impact, and propagates risk across
    downstream dependencies.
    """
    workspace_id = request.workspace_id

    # 1. Fetch workspace tasks
    tasks_res = await db.execute(select(Task).where(Task.workspace_id == workspace_id))
    tasks = tasks_res.scalars().all()
    if not tasks:
        raise HTTPException(status_code=404, detail="Workspace has no tasks to correlate with.")

    # 2. Extract delay days, sentiment, and severity
    delay_days = EventAnalyzer.extract_delay_days(request.text)
    sentiment, severity = EventAnalyzer.classify_sentiment_and_severity(request.text, delay_days)

    # 3. Semantic / Hybrid search for matching task
    matched_task, sim_score = await EventAnalyzer.match_task_node(request.text, tasks)

    # 4. Save Event to DB
    event_id = f"EVT-{str(uuid.uuid4())[:8].upper()}"
    event_record = WorkspaceEvent(
        id=event_id,
        workspace_id=workspace_id,
        author=request.author,
        raw_text=request.text,
        matched_task_id=matched_task.id if matched_task else None,
        similarity_score=sim_score,
        sentiment=sentiment,
        delay_impact_days=delay_days,
        severity=severity,
        processed=True,
    )
    db.add(event_record)
    await db.commit()

    affected_nodes_impact: List[AffectedNodeImpact] = []
    proposed_actions_count = 0

    # 5. If delay or blocker detected and task matched, execute Module C (Risk Propagation)
    if matched_task and (delay_days > 0 or sentiment in ("blocker", "negative")):
        # Mark trigger task as blocked or at_risk
        trigger_status = "blocked" if severity == "critical" else "at_risk"
        matched_task.status = trigger_status
        matched_task.cumulative_delay_days = (matched_task.cumulative_delay_days or 0) + delay_days
        matched_task.delay_reason = f"Event from {request.author}: '{request.text}'"

        # Build Graph for cascading
        deps_res = await db.execute(select(TaskDependency).where(TaskDependency.workspace_id == workspace_id))
        deps = deps_res.scalars().all()
        G = GraphEngine.build_digraph(tasks, deps)

        cascade_result = GraphEngine.propagate_risk(
            G,
            matched_task.id,
            delay_days=delay_days,
            trigger_status=trigger_status,
            reason=matched_task.delay_reason
        )

        # Update DB for all descendants
        for aff in cascade_result.get("affected_nodes", []):
            child_id = aff["node_id"]
            child_task = next((t for t in tasks if t.id == child_id), None)
            if child_task:
                child_task.status = aff["new_status"]
                child_task.cumulative_delay_days = aff["cumulative_delay_days"]
                child_task.delay_reason = f"Cascaded downstream risk from {matched_task.title}"

            affected_nodes_impact.append(
                AffectedNodeImpact(
                    node_id=child_id,
                    title=aff["title"],
                    previous_status=aff["previous_status"],
                    new_status=aff["new_status"],
                    cumulative_delay_days=aff["cumulative_delay_days"]
                )
            )

        await db.commit()

        # 6. Module D: Draft Human-in-the-Loop Agent Action Proposal
        action_title = f"Mitigate {matched_task.title} Delay (+{delay_days}d)"
        rationale = (
            f"Event reported by {request.author}: '{request.text}'. "
            f"Cascades risk to {len(affected_nodes_impact)} downstream dependencies."
        )
        impact_summary = (
            f"Downstream milestone impact: {len(affected_nodes_impact)} tasks shifted. "
            f"New critical path estimate is {cascade_result.get('critical_path_duration_days', 0)} days."
        )
        action_payload = {
            "resolve_blocker": True,
            "extend_duration": delay_days,
            "affected_tasks": [a.node_id for a in affected_nodes_impact],
            "reason": request.text
        }
        await ActionService.create_action_proposal(
            db=db,
            workspace_id=workspace_id,
            task_id=matched_task.id,
            title=action_title,
            action_type="reschedule",
            proposed_shift_days=delay_days,
            rationale=rationale,
            impact_summary=impact_summary,
            payload=action_payload,
        )
        proposed_actions_count = 1

    # 7. Broadcast real-time updates over WebSocket
    fresh_graph = await GraphService.get_graph_state(db, workspace_id)
    await ws_manager.broadcast_to_workspace(
        workspace_id,
        {
            "type": "event_ingested",
            "event": {
                "id": event_record.id,
                "author": event_record.author,
                "raw_text": event_record.raw_text,
                "sentiment": event_record.sentiment,
                "severity": event_record.severity,
                "matched_task_id": event_record.matched_task_id,
                "delay_impact_days": event_record.delay_impact_days,
                "created_at": event_record.created_at.isoformat(),
            },
            "fresh_graph": fresh_graph.model_dump(),
        }
    )

    msg = (
        f"Event correlated with '{matched_task.title}' (confidence {int(sim_score * 100)}%). "
        f"Cascaded risk across {len(affected_nodes_impact)} downstream tasks."
        if matched_task else "Event ingested but no matching task found."
    )

    return IngestEventResponse(
        event_id=event_record.id,
        workspace_id=workspace_id,
        matched_task_id=matched_task.id if matched_task else None,
        matched_task_title=matched_task.title if matched_task else None,
        similarity_score=round(sim_score, 3),
        sentiment=sentiment,
        delay_impact_days=delay_days,
        severity=severity,
        affected_descendants_count=len(affected_nodes_impact),
        affected_nodes=affected_nodes_impact,
        proposed_actions_count=proposed_actions_count,
        message=msg
    )


@router.get("/{workspace_id}", response_model=List[EventItem])
async def list_workspace_events(
    workspace_id: str,
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(WorkspaceEvent)
        .where(WorkspaceEvent.workspace_id == workspace_id)
        .order_by(desc(WorkspaceEvent.created_at))
        .limit(30)
    )
    res = await db.execute(query)
    events = res.scalars().all()
    return [
        EventItem(
            id=e.id,
            workspace_id=e.workspace_id,
            author=e.author,
            raw_text=e.raw_text,
            matched_task_id=e.matched_task_id,
            sentiment=e.sentiment,
            delay_impact_days=e.delay_impact_days,
            severity=e.severity,
            created_at=e.created_at,
        )
        for e in events
    ]

