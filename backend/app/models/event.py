import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class WorkspaceEvent(Base):
    __tablename__ = "workspace_events"

    id = Column(String, primary_key=True, index=True)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    author = Column(String, default="Team Member")
    raw_text = Column(Text, nullable=False)
    matched_task_id = Column(String, ForeignKey("tasks.id"), nullable=True)
    similarity_score = Column(Float, default=0.0)
    sentiment = Column(String, default="neutral")  # positive, neutral, negative, blocker
    delay_impact_days = Column(Integer, default=0)
    severity = Column(String, default="info")       # info, warning, critical
    processed = Column(Boolean, default=True)

    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    workspace = relationship("Workspace", back_populates="events")

