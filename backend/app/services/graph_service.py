import json
import logging
import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.task import Task, TaskDependency
from app.models.action import AgentAction
from app.graph.engine import GraphEngine
from app.graph.layout import compute_dag_layout
from app.schemas.graph import (
    ReactFlowNode,
    ReactFlowEdge,
    TaskNodeData,
    NodePosition,
    GraphStateResponse,
    WorkspaceMetrics,
    NodeUpdatePayload,
)
from app.websockets.connection_manager import ws_manager

logger = logging.getLogger(__name__)


class GraphService:
    @staticmethod
    async def get_graph_state(db: AsyncSession, workspace_id: str) -> GraphStateResponse:
        # Fetch tasks and dependencies
        tasks_res = await db.execute(select(Task).where(Task.workspace_id == workspace_id))
        tasks = tasks_res.scalars().all()

        deps_res = await db.execute(select(TaskDependency).where(TaskDependency.workspace_id == workspace_id))
        dependencies = deps_res.scalars().all()

        # Build NetworkX DiGraph
        G = GraphEngine.build_digraph(tasks, dependencies)
        is_dag, cycles = GraphEngine.check_cycles(G)
        critical_path_nodes, _ = GraphEngine.calculate_critical_path(G)
        metrics = GraphEngine.compute_metrics(G, workspace_id, "Project Workspace")

        # Count pending actions
        actions_res = await db.execute(
            select(AgentAction).where(
                AgentAction.workspace_id == workspace_id,
                AgentAction.status == "pending"
            )
        )
        metrics.pending_actions_count = len(actions_res.scalars().all())

        # If positions not set or zeros, compute layout
        needs_layout = any(t.position_x == 0 and t.position_y == 0 for t in tasks)
        if needs_layout and tasks:
            computed_pos = compute_dag_layout(G)
            for t in tasks:
                if t.id in computed_pos:
                    t.position_x, t.position_y = computed_pos[t.id]
            await db.commit()

        # Construct React Flow Nodes
        rf_nodes: List[ReactFlowNode] = []
        for t in tasks:
            is_on_critical_path = t.id in critical_path_nodes
            node_data = TaskNodeData(
                id=t.id,
                title=t.title,
                description=t.description,
                domain=t.domain,
                status=t.status,
                owner=t.owner,
                duration_days=t.duration_days,
                cumulative_delay_days=t.cumulative_delay_days or 0,
                delay_reason=t.delay_reason,
                is_critical_path=is_on_critical_path,
            )
            rf_nodes.append(
                ReactFlowNode(
                    id=t.id,
                    type="taskNode",
                    position=NodePosition(x=t.position_x, y=t.position_y),
                    data=node_data,
                )
            )

        # Construct React Flow Edges
        rf_edges: List[ReactFlowEdge] = []
        for dep in dependencies:
            # Highlight edge if both source and target are in critical path
            is_crit_edge = (
                dep.source_task_id in critical_path_nodes and
                dep.target_task_id in critical_path_nodes
            )
            
            # Highlight edge if source node is at_risk or blocked
            src_task = next((t for t in tasks if t.id == dep.source_task_id), None)
            is_risk_edge = src_task and src_task.status in ("at_risk", "blocked")

            edge_style: Dict[str, Any] = {"strokeWidth": 2.5}
            if is_risk_edge:
                edge_style["stroke"] = "#ef4444" if src_task.status == "blocked" else "#f59e0b"
            elif is_crit_edge:
                edge_style["stroke"] = "#3b82f6"
            else:
                edge_style["stroke"] = "#64748b"

            rf_edges.append(
                ReactFlowEdge(
                    id=f"e-{dep.source_task_id}-{dep.target_task_id}",
                    source=dep.source_task_id,
                    target=dep.target_task_id,
                    label=dep.rationale[:25] + "..." if dep.rationale and len(dep.rationale) > 25 else dep.rationale,
                    animated=bool(is_risk_edge),
                    style=edge_style,
                    data={"rationale": dep.rationale, "is_critical": is_crit_edge}
                )
            )

        return GraphStateResponse(
            workspace_id=workspace_id,
            nodes=rf_nodes,
            edges=rf_edges,
            metrics=metrics,
            has_cycles=not is_dag,
        )

    @classmethod
    async def update_node_and_propagate(
        cls,
        db: AsyncSession,
        workspace_id: str,
        node_id: str,
        payload: NodeUpdatePayload
    ) -> GraphStateResponse:
        task_res = await db.execute(
            select(Task).where(Task.workspace_id == workspace_id, Task.id == node_id)
        )
        task = task_res.scalar_one_or_none()
        if not task:
            raise ValueError(f"Task {node_id} not found in workspace {workspace_id}")

        if payload.status:
            task.status = payload.status
        if payload.cumulative_delay_days is not None:
            task.cumulative_delay_days = payload.cumulative_delay_days
        if payload.delay_reason:
            task.delay_reason = payload.delay_reason
        if payload.owner:
            task.owner = payload.owner

        await db.commit()

        # If status was modified to at_risk or blocked, trigger networkx descendant risk cascade
        if task.status in ("at_risk", "blocked"):
            tasks_res = await db.execute(select(Task).where(Task.workspace_id == workspace_id))
            all_tasks = tasks_res.scalars().all()

            deps_res = await db.execute(select(TaskDependency).where(TaskDependency.workspace_id == workspace_id))
            all_deps = deps_res.scalars().all()

            G = GraphEngine.build_digraph(all_tasks, all_deps)
            cascade_res = GraphEngine.propagate_risk(
                G,
                node_id,
                delay_days=payload.cumulative_delay_days or 2,
                trigger_status=task.status,
                reason=task.delay_reason or "Manual status escalation"
            )

            # Persist cascaded statuses to database
            for affected in cascade_res.get("affected_nodes", []):
                aff_id = affected["node_id"]
                t_match = next((t for t in all_tasks if t.id == aff_id), None)
                if t_match:
                    t_match.status = affected["new_status"]
                    t_match.cumulative_delay_days = affected["cumulative_delay_days"]

            await db.commit()

        # Fetch fresh graph state and broadcast
        fresh_state = await cls.get_graph_state(db, workspace_id)
        await ws_manager.broadcast_to_workspace(
            workspace_id,
            {"type": "graph_updated", "data": fresh_state.model_dump()}
        )
        return fresh_state
