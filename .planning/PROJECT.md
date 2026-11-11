# Project Apex: AI Operating System for Teams (OS Teams)

## 1. Vision & Architecture Overview
"AI Operating System for Teams" is an enterprise multi-tenant workspace platform designed to bridge the chasm between raw human intent (unstructured briefs, meeting notes, PRDs, team chat) and reliable project delivery.

It operates as an intelligent coordination plane:
1. **Unstructured Brief Decomposition**: Ingests raw PRDs and meeting notes, extracting domain-specific deliverables (Engineering, Product, Design, Marketing) and forming a Directed Acyclic Graph (DAG) with explicit dependency rationale.
2. **Dynamic Semantic Index & Ingestion**: Vectorizes team activity (Slack/Teams/mock updates) and matches updates against existing work items via hybrid semantic retrieval.
3. **DAG Risk Propagation Engine**: Uses NetworkX to perform cycle detection, topological sorting, and descendant impact traversal. When any upstream task is delayed or blocked, schedule delays cascade downstream, marking child nodes as `at_risk` and re-calculating critical paths.
4. **Human-in-the-Loop (HITL) Agent Approval Engine**: Strictly gates automated interventions. AI agents draft proposed schedule adjustments, mitigation alerts, and re-allocations into an action queue requiring human authorization with audit logging.
5. **Modern Neo-Brutalist Visual Canvas**: Real-time interactive React Flow workspace with live status indicators, WebSocket state broadcasting, and interactive simulation controls.

## 2. Core Architecture
- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, Lucide React, `@xyflow/react` (React Flow), WebSockets.
- **Backend API**: Python FastAPI with Pydantic v2 schemas, WebSockets, NetworkX graph engine, SQLAlchemy 2.0.
- **Persistence & Vector Store**: PostgreSQL with `pgvector` (with automatic SQLite fallback for zero-dependency local execution).
- **Pub/Sub & Real-time**: WebSockets connection manager + Redis pub/sub.
- **AI/LLM Engine**: Structured JSON decomposition & event analysis with fallback heuristic semantic parsing.

