import logging
from typing import Dict, List, Tuple, Set, Optional, Any
import networkx as nx
from app.schemas.graph import WorkspaceMetrics

logger = logging.getLogger(__name__)


class GraphEngine:
    """
    NetworkX-based Directed Acyclic Graph (DAG) computation engine.
    Handles cycle detection, topological ordering, critical path analysis,
    and downstream risk propagation.
    """

    @staticmethod
    def build_digraph(tasks: List[Any], dependencies: List[Any]) -> nx.DiGraph:
        G = nx.DiGraph()

        # Add nodes
        for task in tasks:
            G.add_node(
                task.id,
                title=task.title,
                domain=task.domain,
                status=task.status,
                owner=task.owner,
                duration_days=task.duration_days,
                cumulative_delay_days=task.cumulative_delay_days or 0,
                delay_reason=task.delay_reason,
                description=task.description,
                position_x=task.position_x,
                position_y=task.position_y,
            )

        # Add directed edges: source -> target
        for dep in dependencies:
            if G.has_node(dep.source_task_id) and G.has_node(dep.target_task_id):
                G.add_edge(
                    dep.source_task_id,
                    dep.target_task_id,
                    rationale=dep.rationale,
                    impact_type=dep.impact_type or "blocking",
                )

        return G

    @staticmethod
    def check_cycles(G: nx.DiGraph) -> Tuple[bool, List[List[str]]]:
        """Returns (is_acyclic, list_of_simple_cycles)"""
        is_dag = nx.is_directed_acyclic_graph(G)
        cycles = []
        if not is_dag:
            cycles = list(nx.simple_cycles(G))
        return is_dag, cycles

    @staticmethod
    def get_topological_sort(G: nx.DiGraph) -> List[str]:
        if not nx.is_directed_acyclic_graph(G):
            return list(G.nodes)
        return list(nx.topological_sort(G))

    @staticmethod
    def calculate_critical_path(G: nx.DiGraph) -> Tuple[List[str], int]:
        """
        Calculates the critical path (longest weighted path) in the DAG.
        Weight per node = duration_days + cumulative_delay_days.
        """
        if not G.nodes or not nx.is_directed_acyclic_graph(G):
            return [], 0

        # Dynamic programming for longest path in DAG
        topo_order = list(nx.topological_sort(G))
        dist: Dict[str, int] = {}
        prev: Dict[str, Optional[str]] = {}

        for node in topo_order:
            node_duration = G.nodes[node].get("duration_days", 1) + G.nodes[node].get("cumulative_delay_days", 0)
            dist[node] = node_duration
            prev[node] = None

        for u in topo_order:
            u_weight = G.nodes[u].get("duration_days", 1) + G.nodes[u].get("cumulative_delay_days", 0)
            for v in G.successors(u):
                v_weight = G.nodes[v].get("duration_days", 1) + G.nodes[v].get("cumulative_delay_days", 0)
                if dist[u] + v_weight > dist[v]:
                    dist[v] = dist[u] + v_weight
                    prev[v] = u

        if not dist:
            return [], 0

        # Find sink node with maximum distance
        sink_node = max(dist, key=dist.get)
        max_duration = dist[sink_node]

        # Reconstruct path
        path = []
        curr = sink_node
        while curr is not None:
            path.append(curr)
            curr = prev.get(curr)
        path.reverse()

        return path, max_duration

    @classmethod
    def propagate_risk(
        cls,
        G: nx.DiGraph,
        trigger_node_id: str,
        delay_days: int,
        trigger_status: str = "blocked",
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Traverses downstream dependencies using networkx.descendants().
        Updates affected nodes to 'at_risk', recomputes cumulative delays,
        and identifies critical path shifts.
        """
        if not G.has_node(trigger_node_id):
            return {"error": f"Node {trigger_node_id} not found in graph"}

        # 1. Update trigger node
        node_data = G.nodes[trigger_node_id]
        node_data["status"] = trigger_status
        node_data["cumulative_delay_days"] = node_data.get("cumulative_delay_days", 0) + delay_days
        if reason:
            node_data["delay_reason"] = reason

        # 2. Extract all transitive downstream dependencies
        descendants: Set[str] = nx.descendants(G, trigger_node_id)
        affected_nodes_info = []

        # 3. Process descendants in topological order for clean cumulative propagation
        if nx.is_directed_acyclic_graph(G):
            full_topo = list(nx.topological_sort(G))
            ordered_descendants = [n for n in full_topo if n in descendants]
        else:
            ordered_descendants = list(descendants)

        for child in ordered_descendants:
            child_data = G.nodes[child]
            prev_status = child_data.get("status", "on_track")

            # Only escalate status if not already completed
            if prev_status != "completed":
                child_data["status"] = "at_risk"

            # Compute parent max delay
            parents = list(G.predecessors(child))
            parent_max_delay = max(
                (G.nodes[p].get("cumulative_delay_days", 0) for p in parents),
                default=0
            )

            child_data["cumulative_delay_days"] = parent_max_delay
            if not child_data.get("delay_reason"):
                child_data["delay_reason"] = f"Cascade from upstream blocker: {trigger_node_id}"

            affected_nodes_info.append({
                "node_id": child,
                "title": child_data.get("title", ""),
                "previous_status": prev_status,
                "new_status": child_data.get("status", "at_risk"),
                "cumulative_delay_days": child_data.get("cumulative_delay_days", 0)
            })

        # 4. Recompute critical path and metrics
        crit_path, crit_duration = cls.calculate_critical_path(G)

        return {
            "trigger_node": {
                "id": trigger_node_id,
                "status": trigger_status,
                "cumulative_delay_days": node_data.get("cumulative_delay_days", 0),
            },
            "descendants_count": len(descendants),
            "affected_nodes": affected_nodes_info,
            "critical_path": crit_path,
            "critical_path_duration_days": crit_duration
        }

    @classmethod
    def compute_metrics(cls, G: nx.DiGraph, workspace_id: str, workspace_name: str) -> WorkspaceMetrics:
        total = G.number_of_nodes()
        if total == 0:
            return WorkspaceMetrics(
                workspace_id=workspace_id,
                workspace_name=workspace_name,
                health_status="healthy",
                total_tasks=0,
                completed_tasks=0,
                at_risk_tasks=0,
                blocked_tasks=0,
                completion_percentage=0.0,
                critical_path_duration_days=0,
                total_delayed_days=0,
                pending_actions_count=0
            )

        completed = sum(1 for _, d in G.nodes(data=True) if d.get("status") == "completed")
        blocked = sum(1 for _, d in G.nodes(data=True) if d.get("status") == "blocked")
        at_risk = sum(1 for _, d in G.nodes(data=True) if d.get("status") == "at_risk")
        total_delay = sum(d.get("cumulative_delay_days", 0) for _, d in G.nodes(data=True))

        # Overall health designation
        if blocked > 0:
            health = "critical"
        elif at_risk > 0:
            health = "at_risk"
        else:
            health = "healthy"

        pct = round((completed / total) * 100.0, 1)
        _, crit_duration = cls.calculate_critical_path(G)

        return WorkspaceMetrics(
            workspace_id=workspace_id,
            workspace_name=workspace_name,
            health_status=health,
            total_tasks=total,
            completed_tasks=completed,
            at_risk_tasks=at_risk,
            blocked_tasks=blocked,
            completion_percentage=pct,
            critical_path_duration_days=crit_duration,
            total_delayed_days=total_delay,
            pending_actions_count=0
        )
