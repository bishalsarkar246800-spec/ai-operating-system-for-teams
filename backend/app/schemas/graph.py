from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class NodePosition(BaseModel):
    x: float
    y: float


class TaskNodeData(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    domain: str = "Engineering"  # Engineering, Product, Design, Marketing
    status: str = "on_track"     # on_track, at_risk, blocked, completed
    owner: str = "Unassigned"
    duration_days: int = 3
    cumulative_delay_days: int = 0
    delay_reason: Optional[str] = None
    is_critical_path: bool = False


class ReactFlowNode(BaseModel):
    id: str
    type: str = "taskNode"
    position: NodePosition
    data: TaskNodeData


class ReactFlowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    animated: bool = False
    style: Optional[Dict[str, Any]] = None
    data: Optional[Dict[str, Any]] = None


class WorkspaceMetrics(BaseModel):
    workspace_id: str
    workspace_name: str
    health_status: str = "healthy"  # healthy, at_risk, critical
    total_tasks: int = 0
    completed_tasks: int = 0
    at_risk_tasks: int = 0
    blocked_tasks: int = 0
    completion_percentage: float = 0.0
    critical_path_duration_days: int = 0
    total_delayed_days: int = 0
    pending_actions_count: int = 0


class GraphStateResponse(BaseModel):
    workspace_id: str
    nodes: List[ReactFlowNode]
    edges: List[ReactFlowEdge]
    metrics: WorkspaceMetrics
    has_cycles: bool = False


class NodeUpdatePayload(BaseModel):
    status: Optional[str] = None
    cumulative_delay_days: Optional[int] = None
    delay_reason: Optional[str] = None
    owner: Optional[str] = None

