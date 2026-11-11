from pydantic import BaseModel, Field
from typing import Optional, List
import datetime


class IngestEventRequest(BaseModel):
    workspace_id: str
    author: str = "Team Member"
    text: str = Field(..., description="Unstructured update or chat text from team member")


class AffectedNodeImpact(BaseModel):
    node_id: str
    title: str
    previous_status: str
    new_status: str
    cumulative_delay_days: int


class IngestEventResponse(BaseModel):
    event_id: str
    workspace_id: str
    matched_task_id: Optional[str]
    matched_task_title: Optional[str]
    similarity_score: float
    sentiment: str
    delay_impact_days: int
    severity: str
    affected_descendants_count: int
    affected_nodes: List[AffectedNodeImpact]
    proposed_actions_count: int
    message: str


class EventItem(BaseModel):
    id: str
    workspace_id: str
    author: str
    raw_text: str
    matched_task_id: Optional[str]
    sentiment: str
    delay_impact_days: int
    severity: str
    created_at: datetime.datetime

