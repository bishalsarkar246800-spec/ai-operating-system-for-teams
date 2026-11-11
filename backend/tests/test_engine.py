import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import init_db, AsyncSessionLocal
from app.services.workspace_service import WorkspaceService
from app.services.graph_service import GraphService
from app.services.action_service import ActionService
from app.ai.event_analyzer import EventAnalyzer
from app.ai.decomposer import BriefDecomposer
from app.schemas.event import IngestEventRequest
from app.schemas.decompose import DecomposeRequest


async def run_integration_tests():
    print("=== STARTING BACKEND INTEGRATION TESTS ===")
    
    # 1. Initialize DB
    await init_db()
    print("✔ Database initialized")

    # 2. Seed workspace
    async with AsyncSessionLocal() as session:
        await WorkspaceService.seed_sample_workspace(session, "test-workspace")
        print("✔ Workspace seeded")

        # 3. Retrieve Graph State
        graph = await GraphService.get_graph_state(session, "test-workspace")
        assert len(graph.nodes) == 8, f"Expected 8 nodes, got {len(graph.nodes)}"
        assert len(graph.edges) == 7, f"Expected 7 edges, got {len(graph.edges)}"
        assert graph.metrics.health_status == "healthy"
        print(f"✔ Graph retrieved: {len(graph.nodes)} nodes, {len(graph.edges)} edges, health={graph.metrics.health_status}")

        # 4. Test Event Ingestion & Downstream Risk Cascade
        # Send event: "Auth migration delayed by 3 days due to third-party outage"
        event_text = "Auth0 SSO provider migration delayed by 3 days due to third-party outage"
        matched_task, sim_score = await EventAnalyzer.match_task_node(event_text, [n.data for n in graph.nodes])
        print(f"Matched task result: {matched_task.id if matched_task else None} - {matched_task.title if matched_task else None}")
        assert matched_task is not None
        assert "TASK-03" in matched_task.id
        print(f"✔ Event matched task: {matched_task.id} - '{matched_task.title}' (sim={sim_score:.2f})")

        # Update node to at_risk and propagate
        from app.schemas.graph import NodeUpdatePayload
        updated_state = await GraphService.update_node_and_propagate(
            session,
            "test-workspace",
            matched_task.id,
            NodeUpdatePayload(status="blocked", cumulative_delay_days=3, delay_reason=event_text)
        )
        assert updated_state.metrics.health_status == "critical"
        assert updated_state.metrics.blocked_tasks >= 1
        assert updated_state.metrics.at_risk_tasks >= 1
        print(f"✔ Risk propagation verified: blocked={updated_state.metrics.blocked_tasks}, at_risk={updated_state.metrics.at_risk_tasks}")

        # 5. Create and Approve HITL Action
        action = await ActionService.create_action_proposal(
            db=session,
            workspace_id="test-workspace",
            task_id=matched_task.id,
            title="Mitigate Auth Blocker (+3 days)",
            action_type="reschedule",
            proposed_shift_days=3,
            rationale="Approved schedule extension",
            impact_summary="Shifts dependent deliverables",
            payload={"resolve_blocker": True, "extend_duration": 3}
        )
        assert action.status == "pending"
        print(f"✔ Action proposed: {action.id} (status={action.status})")

        # Approve Action
        approval_res = await ActionService.approve_action(
            db=session,
            workspace_id="test-workspace",
            action_id=action.id,
            actor="Principal Engineer",
            note="Approved for beta release"
        )
        assert approval_res["status"] == "approved"
        print(f"✔ Action approved by: {approval_res['actor']}")

        # Verify Audit Log
        logs = await ActionService.list_audit_logs(session, "test-workspace")
        assert len(logs) >= 1
        assert logs[0].decision == "approved"
        print(f"✔ Audit log confirmed: decision={logs[0].decision}, actor={logs[0].actor}")

        # 6. Test Brief Decomposition
        brief_sample = """
        # Mobile Launch Initiative
        ## Engineering
        - Implement PostgreSQL connection pool
        - Build Redis real-time queue
        ## Design
        - Figma design audit
        ## Marketing
        - Press release distribution
        """
        tasks, deps = await BriefDecomposer.decompose_brief(brief_sample, "test-workspace")
        assert len(tasks) >= 4
        print(f"✔ Brief decomposed: {len(tasks)} tasks, {len(deps)} dependencies extracted")

    print("\n🎉 ALL BACKEND INTEGRATION TESTS PASSED PERFECTLY!")


if __name__ == "__main__":
    asyncio.run(run_integration_tests())
