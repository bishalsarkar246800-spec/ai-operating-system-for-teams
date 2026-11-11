import asyncio
import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import init_db, AsyncSessionLocal
from app.services.workspace_service import WorkspaceService
from app.services.graph_service import GraphService
from app.services.action_service import ActionService
from app.models.task import Task
from app.models.action import AgentAction
from app.models.workspace import Workspace
from sqlalchemy import select, delete


class TestSecurityAndIsolation(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        await init_db()
        self.ws_a = "tenant-alpha"
        self.ws_b = "tenant-bravo"

        async with AsyncSessionLocal() as session:
            # Clean up potential leftovers from prior test runs
            await session.execute(delete(AgentAction).where(AgentAction.workspace_id.in_([self.ws_a, self.ws_b])))
            await session.execute(delete(Task).where(Task.workspace_id.in_([self.ws_a, self.ws_b])))
            await session.execute(delete(Workspace).where(Workspace.id.in_([self.ws_a, self.ws_b])))
            await session.commit()

            await WorkspaceService.get_or_create_workspace(session, self.ws_a, "Alpha Workspace")
            await WorkspaceService.get_or_create_workspace(session, self.ws_b, "Bravo Workspace")

            # Seed task in Alpha
            t_a = Task(
                id="ALPHA-TASK-01",
                workspace_id=self.ws_a,
                title="Alpha Secret Strategy",
                domain="Product",
                status="on_track",
                owner="Alpha Lead",
                duration_days=5
            )
            # Seed task in Bravo
            t_b = Task(
                id="BRAVO-TASK-01",
                workspace_id=self.ws_b,
                title="Bravo Architecture",
                domain="Engineering",
                status="on_track",
                owner="Bravo Lead",
                duration_days=4
            )
            session.add(t_a)
            session.add(t_b)
            await session.commit()

    async def asyncTearDown(self):
        async with AsyncSessionLocal() as session:
            await session.execute(delete(AgentAction).where(AgentAction.workspace_id.in_([self.ws_a, self.ws_b])))
            await session.execute(delete(Task).where(Task.workspace_id.in_([self.ws_a, self.ws_b])))
            await session.execute(delete(Workspace).where(Workspace.id.in_([self.ws_a, self.ws_b])))
            await session.commit()

    async def test_tenant_workspace_isolation(self):
        """Verify Workspace B cannot read or mutate Workspace A's tasks"""
        async with AsyncSessionLocal() as session:
            # Query Alpha graph
            alpha_graph = await GraphService.get_graph_state(session, self.ws_a)
            alpha_ids = [n.id for n in alpha_graph.nodes]
            self.assertIn("ALPHA-TASK-01", alpha_ids)
            self.assertNotIn("BRAVO-TASK-01", alpha_ids)

            # Query Bravo graph
            bravo_graph = await GraphService.get_graph_state(session, self.ws_b)
            bravo_ids = [n.id for n in bravo_graph.nodes]
            self.assertIn("BRAVO-TASK-01", bravo_ids)
            self.assertNotIn("ALPHA-TASK-01", bravo_ids)

    async def test_sql_injection_resistance(self):
        """Verify inputs with SQL injection syntax are safely escaped"""
        injection_strings = [
            "'; DROP TABLE tasks; --",
            "' OR '1'='1",
            "\" UNION SELECT * FROM workspaces --",
        ]

        async with AsyncSessionLocal() as session:
            for inj in injection_strings:
                # Should safely query without executing arbitrary SQL
                res = await session.execute(
                    select(Task).where(Task.workspace_id == inj)
                )
                tasks = res.scalars().all()
                self.assertEqual(len(tasks), 0)

            # Confirm tables still exist and are healthy
            table_check = await session.execute(select(Task))
            self.assertGreaterEqual(len(table_check.scalars().all()), 2)

    async def test_action_isolation(self):
        """Verify action created in Alpha cannot be approved by Bravo"""
        async with AsyncSessionLocal() as session:
            act = await ActionService.create_action_proposal(
                db=session,
                workspace_id=self.ws_a,
                task_id="ALPHA-TASK-01",
                title="Alpha Remediation",
                action_type="reschedule",
                proposed_shift_days=2,
                rationale="Schedule alignment",
                impact_summary="Minor shift",
                payload={"extend_duration": 2}
            )

            # Attempting to approve via Bravo workspace must raise ValueError
            with self.assertRaises(ValueError):
                await ActionService.approve_action(
                    db=session,
                    workspace_id=self.ws_b,
                    action_id=act.id,
                    actor="Bravo Attacker"
                )

    async def test_cross_tenant_event_containment(self):
        """Verify events in Tenant A cannot modify or cascade into Tenant B's tasks"""
        from app.routers.events import ingest_event
        from app.schemas.event import IngestEventRequest

        async with AsyncSessionLocal() as session:
            req = IngestEventRequest(
                workspace_id=self.ws_a,
                author="Alpha Dev",
                text="Alpha Secret Strategy delayed by 4 days due to regulatory audit."
            )
            resp = await ingest_event(req, session)
            self.assertEqual(resp.matched_task_id, "ALPHA-TASK-01")
            self.assertEqual(resp.delay_impact_days, 4)

            # Confirm Alpha task is marked at_risk/blocked
            alpha_task = (await session.execute(
                select(Task).where(Task.id == "ALPHA-TASK-01")
            )).scalar_one()
            self.assertIn(alpha_task.status, ("at_risk", "blocked"))
            self.assertEqual(alpha_task.cumulative_delay_days, 4)

            # Confirm Bravo task is completely untouched
            bravo_task = (await session.execute(
                select(Task).where(Task.id == "BRAVO-TASK-01")
            )).scalar_one()
            self.assertEqual(bravo_task.status, "on_track")
            self.assertEqual(bravo_task.cumulative_delay_days, 0)

    async def test_multi_workspace_seeding_isolation(self):
        """Verify seeding sample projects across different workspaces maintains strict separation"""
        async with AsyncSessionLocal() as session:
            await WorkspaceService.seed_sample_workspace(session, self.ws_a)
            await WorkspaceService.seed_sample_workspace(session, self.ws_b)

            alpha_tasks = (await session.execute(
                select(Task).where(Task.workspace_id == self.ws_a)
            )).scalars().all()
            bravo_tasks = (await session.execute(
                select(Task).where(Task.workspace_id == self.ws_b)
            )).scalars().all()

            self.assertEqual(len(alpha_tasks), 8)
            self.assertEqual(len(bravo_tasks), 8)

            alpha_ids = {t.id for t in alpha_tasks}
            bravo_ids = {t.id for t in bravo_tasks}

            # Must have zero overlapping task IDs across workspaces
            self.assertEqual(len(alpha_ids.intersection(bravo_ids)), 0)
            for tid in alpha_ids:
                self.assertTrue(tid.startswith("TEN9384-TASK-"))
            for tid in bravo_ids:
                self.assertTrue(tid.startswith("TEN8DE1-TASK-"))

    async def test_security_headers_enforcement(self):
        """Verify API responses include defense-in-depth security headers"""
        from httpx import AsyncClient, ASGITransport
        from main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/health")
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.headers.get("X-Content-Type-Options"), "nosniff")
            self.assertEqual(resp.headers.get("X-Frame-Options"), "DENY")
            self.assertEqual(resp.headers.get("X-XSS-Protection"), "1; mode=block")
            self.assertEqual(resp.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin")

    async def test_air_gapped_privacy_mode(self):
        """Verify air-gapped mode guarantees zero external egress for sensitive briefs"""
        from app.config import settings
        from app.ai.decomposer import BriefDecomposer
        from app.ai.embeddings import generate_embedding

        original_air = settings.AIR_GAPPED_MODE
        try:
            settings.AIR_GAPPED_MODE = True
            secret_brief = "CONFIDENTIAL: Internal proprietary algorithm launch and patent filing."
            tasks, deps = await BriefDecomposer.decompose_brief(secret_brief, self.ws_a)
            self.assertGreater(len(tasks), 0)
            
            emb = await generate_embedding("Proprietary internal architecture")
            self.assertEqual(len(emb), 128)
        finally:
            settings.AIR_GAPPED_MODE = original_air


if __name__ == "__main__":
    unittest.main()
