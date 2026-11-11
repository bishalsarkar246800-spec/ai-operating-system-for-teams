# Project Requirements Specification

## REQ-01: Brief Decomposition Engine (`/api/decompose`)
- **Input**: Raw markdown, meeting minutes, PRD drafts, or unstructured launch briefs.
- **Output**: Validated JSON DAG with nodes (tasks categorized by Engineering, Design, Product, Marketing) and directed edges (`source_task_id -> target_task_id` with dependency rationale).
- **Integrity**: Cycle detection and auto-layout coordinate calculation.

## REQ-02: Workspace Semantic Index & Event Ingestion (`/api/events/ingest`)
- **Vector Index**: Multi-tenant task embeddings for fast hybrid similarity lookup.
- **Event Classification**: Parses team updates (e.g. "Auth migration delayed by 3 days") to determine affected node, sentiment, and schedule delay magnitude in days.

## REQ-03: Downstream Dependency Risk Propagation
- **Traversal**: NetworkX topological traversal and descendant extraction (`networkx.descendants`).
- **Cumulative Delay**: Propagate delay across all dependent downstream tasks.
- **State Transition**: Elevate child node status to `at_risk` or `blocked` and flag critical path changes.
- **Broadcast**: Real-time push via WebSockets to all active workspace sessions.

## REQ-04: Human-in-the-Loop (HITL) Action Gateway
- **Draft Action Generation**: Propose remedial actions ("Shift launch date by 3 days", "Alert team lead") when blockers appear.
- **Endpoints**: `/api/actions/{id}/approve` and `/api/actions/{id}/reject`.
- **Audit Logging**: Immutable history of timestamp, user actor, prior state, and approved modification.

## REQ-05: High-Performance Frontend & DevTool UX
- **React Flow Canvas**: Custom nodes with domain badges, status color coding (Green: On Track, Yellow: At Risk, Red: Blocked, Blue: Done), animated risk edges.
- **Top Metrics Banner**: Overall health status, completion percentage, total active risk count, and critical path timeline.
- **Interactive Side Panel**: Real-time team chat simulator to trigger live blocker cascades, plus Action Approval Drawer.
