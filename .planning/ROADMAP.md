# Implementation Roadmap

## Milestone 1: Foundation & Backend Graph Engine (`feat/backend-graph-engine`)
- [x] Workspace & DB schema modeling (Tenant, Task, Dependency, Event, Action, AuditLog)
- [x] Hybrid PostgreSQL pgvector & lightweight vector index engine
- [x] NetworkX DAG Engine: Cycle detection, topological sort, descendant risk cascade, cumulative delay calculator
- [x] FastAPI REST endpoints & WebSocket state broadcasting hub
- [x] Brief decomposition pipeline (`/api/decompose`) & Event ingestion engine (`/api/events/ingest`)

## Milestone 2: Frontend Interactive DAG Canvas (`feat/frontend-reactflow`)
- [x] Next.js 14 App Router project initialization with Tailwind CSS & Lucide React
- [x] React Flow (`@xyflow/react`) setup with custom Neo-Brutalist TaskNode component
- [x] Real-time DAG layout rendering with domain color badges and status indicators
- [x] Animated risk-cascade edges and interactive node selection
- [x] Top Metrics Banner displaying project health, completion rate, and critical path

## Milestone 3: HITL Action Gateway & Team Simulation (`feat/agent-approval-pipeline`)
- [x] Human-in-the-Loop action proposal generation upon risk detection
- [x] Approval drawer with one-click Approve/Dismiss and live audit log
- [x] Interactive Mock Chat feed allowing real-time event injection
- [x] End-to-end WebSocket synchronization across canvas, chat, metrics, and actions
- [x] Root startup orchestration script (`start.sh`), Docker Compose verification, and full documentation
