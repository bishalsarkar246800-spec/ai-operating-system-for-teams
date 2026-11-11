import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    domain = Column(String, default="Engineering", index=True)  # Engineering, Product, Design, Marketing
    status = Column(String, default="on_track", index=True)      # on_track, at_risk, blocked, completed
    owner = Column(String, default="Unassigned")
    duration_days = Column(Integer, default=3)
    cumulative_delay_days = Column(Integer, default=0)
    delay_reason = Column(Text, nullable=True)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    embedding = Column(Text, nullable=True)  # JSON-encoded float list for semantic lookup

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    workspace = relationship("Workspace", back_populates="tasks")


class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    id = Column(String, primary_key=True, index=True)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    source_task_id = Column(String, ForeignKey("tasks.id"), nullable=False, index=True)
    target_task_id = Column(String, ForeignKey("tasks.id"), nullable=False, index=True)
    rationale = Column(Text, nullable=True)
    impact_type = Column(String, default="blocking")  # blocking, non_blocking

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    workspace = relationship("Workspace", back_populates="dependencies")

