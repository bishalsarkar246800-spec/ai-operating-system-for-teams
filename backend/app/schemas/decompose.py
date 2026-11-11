from pydantic import BaseModel, Field
from typing import List, Optional
from app.schemas.graph import ReactFlowNode, ReactFlowEdge


class DecomposeRequest(BaseModel):
    workspace_id: Optional[str] = Field("default-workspace", max_length=64)
    workspace_name: Optional[str] = Field("Product Launch", max_length=150)
    brief_text: str = Field(..., max_length=50000, description="Raw markdown, PRD, or unstructured project brief")


class ExtractedTask(BaseModel):
    id: str
    title: str
    description: str
    domain: str = "Engineering"  # Engineering, Product, Design, Marketing
    owner: str = "Unassigned"
    duration_days: int = 3


class ExtractedDependency(BaseModel):
    source_task_id: str
    target_task_id: str
    rationale: str


class DecomposeResponse(BaseModel):
    workspace_id: str
    workspace_name: str
    tasks: List[ExtractedTask]
    dependencies: List[ExtractedDependency]
    nodes: List[ReactFlowNode]
    edges: List[ReactFlowEdge]
    total_tasks: int
    critical_path_duration_days: int

