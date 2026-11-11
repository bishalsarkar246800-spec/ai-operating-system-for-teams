import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AgentAction(Base):
    __tablename__ = "agent_actions"

    id = Column(String, primary_key=True, index=True)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=True)
    title = Column(String, nullable=False)
    action_type = Column(String, default="reschedule")  # reschedule, notify_lead, reallocate, escalate
    status = Column(String, default="pending", index=True)  # pending, approved, rejected
    proposed_shift_days = Column(Integer, default=0)
    rationale = Column(Text, nullable=False)
    impact_summary = Column(Text, nullable=True)
    proposed_payload = Column(Text, nullable=True)  # JSON formatted payload for execution
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    workspace = relationship("Workspace", back_populates="actions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    action_id = Column(String, nullable=True)
    actor = Column(String, default="Human Operator")
    decision = Column(String, nullable=False)  # approved, rejected, system_init
    details = Column(Text, nullable=True)     # JSON description of the delta
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    workspace = relationship("Workspace", back_populates="audit_logs")

