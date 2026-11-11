import json
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.workspace import Workspace
from app.models.task import Task, TaskDependency
from app.ai.embeddings import generate_embedding

logger = logging.getLogger(__name__)


class WorkspaceService:
    @staticmethod
    async def get_or_create_workspace(
        db: AsyncSession,
        workspace_id: str,
        name: Optional[str] = None
    ) -> Workspace:
        result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        workspace = result.scalar_one_or_none()
        
        if not workspace:
            workspace = Workspace(
                id=workspace_id,
                name=name or "Project Apex Workspace",
                description="Default collaborative workspace with real-time dependency risk engine."
            )
            db.add(workspace)
            await db.commit()
            await db.refresh(workspace)
            logger.info(f"Created new workspace: {workspace_id}")

        return workspace

    @staticmethod
    async def seed_sample_workspace(db: AsyncSession, workspace_id: str = "apex-launch"):
        """
        Pre-populates a rich, realistic enterprise DAG:
        'Project Apex: Multi-Tenant Platform Launch' with 8 interconnected tasks.
        """
        workspace = await WorkspaceService.get_or_create_workspace(
            db, workspace_id, "Project Apex: Platform Launch"
        )

        # Clear existing tasks & dependencies for fresh seed
        existing_tasks = await db.execute(select(Task).where(Task.workspace_id == workspace_id))
        for t in existing_tasks.scalars().all():
            await db.delete(t)
        
        existing_deps = await db.execute(select(TaskDependency).where(TaskDependency.workspace_id == workspace_id))
        for d in existing_deps.scalars().all():
            await db.delete(d)
        
        await db.commit()

        # Define 8 rich cross-functional tasks
        sample_tasks = [
            {
                "id": "TASK-01",
                "title": "Database Schema & pgvector Migration",
                "description": "Establish multi-tenant relational schemas and semantic indexing tables.",
                "domain": "Engineering",
                "status": "completed",
                "owner": "Devon Vance (Backend)",
                "duration_days": 4,
                "cumulative_delay_days": 0,
                "position_x": 80.0,
                "position_y": 80.0,
            },
            {
                "id": "TASK-02",
                "title": "Design System V2 & Canvas Spec",
                "description": "Finalize Neo-Brutalist typography, tokens, and React Flow node templates.",
                "domain": "Design",
                "status": "completed",
                "owner": "Mia Sato (Design Lead)",
                "duration_days": 3,
                "cumulative_delay_days": 0,
                "position_x": 80.0,
                "position_y": 260.0,
            },
            {
                "id": "TASK-03",
                "title": "Auth0 & SSO Provider Migration",
                "description": "Transition authentication gateway to support enterprise SAML and OAuth.",
                "domain": "Engineering",
                "status": "on_track",
                "owner": "Alex Chen (Tech Lead)",
                "duration_days": 5,
                "cumulative_delay_days": 0,
                "position_x": 420.0,
                "position_y": 80.0,
            },
            {
                "id": "TASK-04",
                "title": "Interactive React Flow Canvas",
                "description": "Develop full-screen DAG node editor with real-time status color badges.",
                "domain": "Engineering",
                "status": "on_track",
                "owner": "Elena Rostova (Frontend)",
                "duration_days": 4,
                "cumulative_delay_days": 0,
                "position_x": 420.0,
                "position_y": 260.0,
            },
            {
                "id": "TASK-05",
                "title": "Real-time Risk Propagation Engine",
                "description": "Build NetworkX DAG traversal to cascade schedule delays to all descendants.",
                "domain": "Engineering",
                "status": "on_track",
                "owner": "Sarah Jenkins (Staff Eng)",
                "duration_days": 3,
                "cumulative_delay_days": 0,
                "position_x": 760.0,
                "position_y": 80.0,
            },
            {
                "id": "TASK-06",
                "title": "Product Onboarding & Self-Serve Tour",
                "description": "Guided walkthrough highlighting blocker cascading and approval queue.",
                "domain": "Product",
                "status": "on_track",
                "owner": "Marcus Aurel (Principal PM)",
                "duration_days": 3,
                "cumulative_delay_days": 0,
                "position_x": 760.0,
                "position_y": 260.0,
            },
            {
                "id": "TASK-07",
                "title": "Mobile App Beta & Push Integration",
                "description": "iOS & Android companion apps syncing live workspace events.",
                "domain": "Engineering",
                "status": "on_track",
                "owner": "Lucas Wright (Mobile Lead)",
                "duration_days": 5,
                "cumulative_delay_days": 0,
                "position_x": 1100.0,
                "position_y": 80.0,
            },
            {
                "id": "TASK-08",
                "title": "Global Launch & Marketing Campaign",
                "description": "Multi-channel announcement, Product Hunt launch, and press releases.",
                "domain": "Marketing",
                "status": "on_track",
                "owner": "Tara Thorne (PMM)",
                "duration_days": 4,
                "cumulative_delay_days": 0,
                "position_x": 1440.0,
                "position_y": 170.0,
            },
        ]

        # Insert tasks with computed embeddings
        for t_dict in sample_tasks:
            emb = await generate_embedding(f"{t_dict['title']} {t_dict['description']}")
            task_model = Task(
                id=t_dict["id"],
                workspace_id=workspace_id,
                title=t_dict["title"],
                description=t_dict["description"],
                domain=t_dict["domain"],
                status=t_dict["status"],
                owner=t_dict["owner"],
                duration_days=t_dict["duration_days"],
                cumulative_delay_days=t_dict["cumulative_delay_days"],
                position_x=t_dict["position_x"],
                position_y=t_dict["position_y"],
                embedding=json.dumps(emb),
            )
            db.add(task_model)

        # Define DAG dependencies
        sample_deps = [
            ("DEP-01", "TASK-01", "TASK-03", "Auth migration requires updated DB credentials and user schemas."),
            ("DEP-02", "TASK-02", "TASK-04", "Canvas components require Design System V2 UI tokens."),
            ("DEP-03", "TASK-03", "TASK-05", "Risk engine telemetry depends on authenticated user sessions."),
            ("DEP-04", "TASK-04", "TASK-06", "Onboarding tour attaches to live interactive canvas."),
            ("DEP-05", "TASK-05", "TASK-07", "Mobile sync requires the risk calculation backend services."),
            ("DEP-06", "TASK-06", "TASK-08", "Global launch is gated by verified self-serve onboarding flow."),
            ("DEP-07", "TASK-07", "TASK-08", "Marketing launch requires public mobile app store approval."),
        ]

        for dep_id, src, tgt, rationale in sample_deps:
            dep_model = TaskDependency(
                id=dep_id,
                workspace_id=workspace_id,
                source_task_id=src,
                target_task_id=tgt,
                rationale=rationale,
                impact_type="blocking"
            )
            db.add(dep_model)

        await db.commit()
        logger.info(f"Seeded workspace {workspace_id} with 8 tasks and 7 dependencies.")
        return workspace

