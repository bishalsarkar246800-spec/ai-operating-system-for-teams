import datetime
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    tasks = relationship("Task", back_populates="workspace", cascade="all, delete-orphan")
    dependencies = relationship("TaskDependency", back_populates="workspace", cascade="all, delete-orphan")
    events = relationship("WorkspaceEvent", back_populates="workspace", cascade="all, delete-orphan")
    actions = relationship("AgentAction", back_populates="workspace", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="workspace", cascade="all, delete-orphan")

