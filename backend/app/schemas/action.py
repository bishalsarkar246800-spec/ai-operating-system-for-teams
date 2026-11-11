from pydantic import BaseModel
from typing import Optional, Any, Dict
import datetime


class ActionResponse(BaseModel):
    id: str
    workspace_id: str
    task_id: Optional[str]
    task_title: Optional[str] = None
    title: str
    action_type: str
    status: str
    proposed_shift_days: int
    rationale: str
    impact_summary: Optional[str]
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None


class ActionDecisionRequest(BaseModel):
    actor: str = "Human Lead"
    note: Optional[str] = None


class ActionDecisionResponse(BaseModel):
    action_id: str
    status: str
    actor: str
    applied_changes: Dict[str, Any]
    message: str


class AuditLogItem(BaseModel):
    id: str
    workspace_id: str
    action_id: Optional[str]
    actor: str
    decision: str
    details: Optional[str]
    timestamp: datetime.datetime
