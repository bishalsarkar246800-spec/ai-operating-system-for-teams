import unittest
import networkx as nx
from app.graph.engine import GraphEngine
from app.graph.layout import compute_dag_layout


class DummyTask:
    def __init__(self, id, title, domain="Engineering", status="on_track", duration=3, delay=0):
        self.id = id
        self.title = title
        self.domain = domain
        self.status = status
        self.owner = "Engineer"
        self.duration_days = duration
        self.cumulative_delay_days = delay
        self.delay_reason = None
        self.description = f"Description for {title}"
        self.position_x = 0.0
        self.position_y = 0.0


class DummyDep:
    def __init__(self, src, tgt, rationale="Dependency link"):
        self.source_task_id = src
        self.target_task_id = tgt
        self.rationale = rationale
        self.impact_type = "blocking"


class TestGraphEngine(unittest.TestCase):
    def setUp(self):
        # Setup diamond DAG: T1 -> T2, T1 -> T3, T2 -> T4, T3 -> T4
        self.tasks = [
            DummyTask("T1", "Task 1", duration=2),
            DummyTask("T2", "Task 2", duration=3),
            DummyTask("T3", "Task 3", duration=4),
            DummyTask("T4", "Task 4", duration=2),
        ]
        self.deps = [
            DummyDep("T1", "T2"),
            DummyDep("T1", "T3"),
            DummyDep("T2", "T4"),
            DummyDep("T3", "T4"),
        ]
        self.G = GraphEngine.build_digraph(self.tasks, self.deps)

    def test_dag_acyclicity(self):
        is_dag, cycles = GraphEngine.check_cycles(self.G)
        self.assertTrue(is_dag)
        self.assertEqual(len(cycles), 0)

    def test_cycle_detection(self):
        # Introduce cycle: T4 -> T1
        cyclic_G = self.G.copy()
        cyclic_G.add_edge("T4", "T1")
        is_dag, cycles = GraphEngine.check_cycles(cyclic_G)
        self.assertFalse(is_dag)
        self.assertGreater(len(cycles), 0)

    def test_critical_path(self):
        # Path 1: T1(2) + T2(3) + T4(2) = 7
        # Path 2: T1(2) + T3(4) + T4(2) = 8 (Critical Path)
        path, duration = GraphEngine.calculate_critical_path(self.G)
        self.assertEqual(duration, 8)
        self.assertEqual(path, ["T1", "T3", "T4"])

    def test_descendant_risk_propagation(self):
        # Propagate a 3-day blocker from T1
        cascade = GraphEngine.propagate_risk(
            self.G,
            trigger_node_id="T1",
            delay_days=3,
            trigger_status="blocked",
            reason="Hardware failure"
        )
        self.assertEqual(cascade["trigger_node"]["status"], "blocked")
        self.assertEqual(cascade["trigger_node"]["cumulative_delay_days"], 3)
        self.assertEqual(cascade["descendants_count"], 3)  # T2, T3, T4

        # Verify all descendants are marked at_risk with cumulative delay
        for child_id in ["T2", "T3", "T4"]:
            self.assertEqual(self.G.nodes[child_id]["status"], "at_risk")
            self.assertEqual(self.G.nodes[child_id]["cumulative_delay_days"], 3)

        # Re-verify critical path after cascade: T1(2+3) + T3(4+3) + T4(2+3) = 17
        _, new_duration = GraphEngine.calculate_critical_path(self.G)
        self.assertEqual(new_duration, 17)

    def test_dag_layout_generation(self):
        positions = compute_dag_layout(self.G)
        self.assertEqual(len(positions), 4)
        # Root T1 should be at column 0
        self.assertEqual(positions["T1"][0], 80.0)
        # T4 should be downstream
        self.assertGreater(positions["T4"][0], positions["T1"][0])


if __name__ == "__main__":
    unittest.main()

