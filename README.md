# AI Operating System for Teams (OS Teams)

[![CI Suite](https://github.com/bishalsarkar246800-spec/ai-operating-system-for-teams/actions/workflows/ci.yml/badge.svg)](https://github.com/bishalsarkar246800-spec/ai-operating-system-for-teams/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![React Flow](https://img.shields.io/badge/@xyflow/react-12-ff0072.svg)](https://reactflow.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)

An intelligent, multi-tenant workspace platform that transforms unstructured product briefs and team chatter into directed dependency graphs, detects and propagates downstream schedule risks in real time, and executes human-approved agent remedial interventions.

---

## 🏛 System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 14 + React Flow)"]
        Canvas["Interactive DAG Canvas (@xyflow/react)"]
        Metrics["Top Metrics & Health Banner"]
        Activity["Activity Feed & Mock Team Chat"]
        Approval["HITL Action Approval Drawer"]
        WSClient["WebSocket Client Hook"]
    end

    subgraph API ["Backend (FastAPI)"]
        Decomp["/api/decompose (Brief Parser)"]
        Ingest["/api/events/ingest (Event Semantic Router)"]
        Actions["/api/actions (HITL Gateway)"]
        WSHub["WebSocket Broadcast Hub & Redis Pub/Sub"]
        GraphEngine["NetworkX DAG & Risk Engine"]
    end

    subgraph Storage ["Persistence Layer"]
        PG[("PostgreSQL + pgvector")]
        Redis[("Redis Event Queue")]
    end

    Canvas <-->|REST & WS| WSHub
    Activity -->|Send Update| Ingest
    Approval -->|Approve/Dismiss| Actions
    Decomp -->|Tasks & Edges| GraphEngine
    Ingest -->|Vector Similarity| GraphEngine
    GraphEngine -->|Descendants & Delays| WSHub
    GraphEngine -->|Draft Actions| Actions
    Actions -->|Audit & State Update| PG
    WSHub <--> Redis
```

---

## 🚀 Key Modules & Capabilities

### 1. Unstructured Brief Decomposition (`/api/decompose`)
- Ingests raw markdown, PRD drafts, feature specs, or meeting transcripts.
- Deconstructs content into concrete work items across four core disciplines: **Engineering**, **Product**, **Design**, and **Marketing**.
- Automatically establishes directed edges (`source_task_id -> target_task_id`) along with explicit dependency reasoning.
- Validates graph acyclicity (`networkx.is_directed_acyclic_graph`) and assigns 2D canvas coordinates using hierarchical DAG topological layering.

### 2. Workspace Semantic Index & Event Ingestion (`/api/events/ingest`)
- Vectors workspace task titles and descriptions.
- When team updates or chat messages arrive (e.g., *"Auth migration delayed by 3 days due to OAuth credential refresh"*), the system uses semantic retrieval to pin the exact task node.
- Extracts delay magnitude, severity, and blocker flags.

### 3. Downstream Dependency Risk Propagation
- Employs `networkx.descendants()` to traverse transitive dependencies.
- When a node is flagged `blocked` or `at_risk`, the delay propagates downstream:
  $$\text{Cumulative Delay}(\text{child}) = \max_{\text{parents}}(\text{Delay}(\text{parent})) + \text{Local Delay}$$
- Recomputes critical paths and pushes live status cascades to all connected clients over WebSockets.

### 4. Human-in-the-Loop (HITL) Action Approval Gateway
- AI agents do **not** mutate deadlines or external systems autonomously.
- Proposes structured `AgentAction` drafts (e.g., *"Shift Mobile Launch by 3 days"*, *"Notify Design Lead of blocker"*).
- Exposes `/api/actions/{id}/approve` and `/api/actions/{id}/reject` with full audit logs tracking actor, timestamp, and delta.

### 5. Neo-Brutalist Modern DevTool UI & Dual Views
- High-contrast, sharp visual canvas with custom `@xyflow/react` task nodes.
- **Dual Visual Modes**:
  - 🗺 **DAG Canvas**: Interactive node-graph canvas with zoom, pan, minimap, domain filter pills (Engineering, Design, Product, Marketing), and critical-path highlighting.
  - 📊 **Timeline Schedule**: Horizontal Gantt-style schedule view computing task bounding dates and dependency lags.
- **Task Inspector**: Click any task card to open the detailed inspector showing prerequisites, downstream deliverables, owner, duration, delay diagnostics, and manual status/delay overrides.
- **Multi-Tenant Workspace Selector**: Switch between different projects or create new workspaces with isolated graphs and activity streams.
- Color-coded status badges:
  - 🟢 **On Track** (Green)
  - 🟡 **At Risk** (Yellow / Amber)
  - 🔴 **Blocked** (Red)
  - 🔵 **Completed** (Blue)
- Interactive mock chat simulator allowing live injection of delays and blockers to observe real-time visual cascades.

---

## 🧪 Testing & Verification

The platform includes full automated test suites covering graph theory algorithms, end-to-end integration flows, and multi-tenant security isolation.

### Run Backend Tests
```bash
cd backend
.venv/bin/python3 -m unittest backend/tests/test_engine.py backend/tests/test_graph_engine.py backend/tests/test_security_isolation.py
```
- **`test_graph_engine.py`**: Tests acyclicity, cycle detection, critical path calculation via topological sort, descendant risk cascading, and 2D layout generation.
- **`test_engine.py`**: End-to-end verification across Modules A through D.
- **`test_security_isolation.py`**: Verifies multi-tenant boundary isolation, SQL injection resistance, cross-tenant action gating, and event containment.

### Run Frontend Static Type Verification
```bash
cd frontend
npm test
```
Verifies strict TypeScript typing across all React Flow nodes, modals, hooks, and views without errors.

---

## 🛠 Tech Stack

| Tier | Technologies |
|---|---|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide React, `@xyflow/react` |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn, WebSockets |
| **Graph Engine** | NetworkX (DAG topological sorting, cycle detection, descendant traversal) |
| **Data & Vectors** | PostgreSQL 16 with `pgvector`, SQLAlchemy 2.0 (with SQLite zero-config fallback) |
| **Real-time Queue**| WebSockets Connection Manager, Redis 7 (Pub/Sub) |
| **AI / Parsing** | Pydantic JSON Structured Output & Semantic Embedding Engine |

---

## ⚡ Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ (Node 20+ recommended)
- Docker & Docker Compose (optional, for PostgreSQL/Redis)

### Option 1: One-Click Startup Script
```bash
# Clone the repository
git clone <repo-url>
cd "OS TEAMS"

# Run the unified start script (sets up virtualenv, installs frontend deps, starts both)
chmod +x start.sh
./start.sh
```

### Option 2: Docker Compose (Infrastructure)
```bash
# Start PostgreSQL (pgvector) and Redis
docker compose up -d

# Verify healthy containers
docker compose ps
```

### Option 3: Manual Step-by-Step

#### 1. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run FastAPI server on port 8000
python3 main.py
```
Backend API will be available at: `http://localhost:8000` (Swagger docs at `/docs`)

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend UI will be accessible at: `http://localhost:3000`

---

## 📡 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/decompose` | Ingests raw brief markdown and returns nodes + edges |
| `POST` | `/api/events/ingest` | Ingests team chat / event and triggers risk propagation |
| `GET` | `/api/workspaces` | Lists all active workspaces with task counts |
| `POST` | `/api/workspaces` | Creates a new workspace with custom ID and name |
| `GET` | `/api/graph/{workspace_id}` | Fetches current DAG state, nodes, edges, and metrics |
| `POST` | `/api/graph/{workspace_id}/task` | Manually creates a task deliverable with optional dependency |
| `POST` | `/api/graph/{workspace_id}/node/{node_id}` | Manually updates task status or parameters |
| `GET` | `/api/actions` | Lists pending and audited agent actions |
| `POST` | `/api/actions/{id}/approve` | Approves agent recommendation and updates graph |
| `POST` | `/api/actions/{id}/reject` | Dismisses agent recommendation |
| `POST` | `/api/seed` | Pre-populates a rich demo workspace with 8 connected tasks |
| `WS` | `/ws/{workspace_id}` | Real-time WebSocket connection for graph and activity sync |

---

## 🔒 Environment Variables

### Backend (`backend/.env`)
```env
PORT=8000
HOST=0.0.0.0
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_teams_os
# If DATABASE_URL is not provided or postgres is offline, defaults seamlessly to sqlite+aiosqlite:///./ai_teams.db
REDIS_URL=redis://localhost:6379/0
AIR_GAPPED_MODE=false         # Set to true for 100% on-premise air-gapped zero external egress
OPENAI_API_KEY=your_key_here  # Optional; heuristic fallback operates with full fidelity
GEMINI_API_KEY=your_key_here  # Optional
```

---

## 🛡️ Privacy & Zero Data Leakage Architecture

For enterprise teams operating with confidential product specs, source code, or internal roadmaps:

1. **Air-Gapped & Offline Guarantee**:
   - Setting `AIR_GAPPED_MODE=true` ensures **zero bytes** of raw briefs, events, or deliverables leave your local network.
   - Built-in deterministic 128-dimensional n-gram feature hashing runs locally for semantic embedding calculation without calling external APIs.
   - Heuristic DAG parser decomposes unstructured markdown briefs directly on the server with zero third-party telemetry.
2. **Multi-Tenant Workspace Isolation**:
   - Every workspace is strictly isolated with non-colliding task prefixing (`{PREFIX}-TASK-XX`) and scoped database queries.
   - WebSocket broadcast channels are segmented per workspace ID; clients never receive real-time streams of other projects or tenants.
3. **Defense-in-Depth HTTP Headers**:
   - API middleware automatically enforces strict protection headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
4. **Human-in-the-Loop Gateway**:
   - Agents never possess autonomous write privileges to mutate critical deadlines or milestone baselines without explicit operator approval and audit logging.

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

