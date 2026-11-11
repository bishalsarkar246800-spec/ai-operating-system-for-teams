<div align="center">

  <img src="assets/logo.svg" alt="AI Teams OS Logo" width="80" height="80" />

  # AI Teams OS

  **The Autonomous Multi-Tenant Operating System for High-Velocity Product & Engineering Teams.**

  Transform raw launch briefs and unstructured team chatter into live dependency DAGs, propagate downstream schedule risks with transitive graph traversal, and execute human-approved agent interventions in real time.

  <p>
    <a href="#-quickstart-guide"><b>Quickstart</b></a> •
    <a href="#-what-is-ai-teams-os"><b>What is AI Teams OS?</b></a> •
    <a href="#-core-capabilities"><b>Features</b></a> •
    <a href="#-system-architecture"><b>Architecture</b></a> •
    <a href="#-testing--verification"><b>Testing</b></a> •
    <a href="#-privacy--security-architecture"><b>Security & Privacy</b></a> •
    <a href="#-api-reference"><b>API Docs</b></a>
  </p>

  <!-- Badges Row 1: Status & Platforms -->
  <p>
    <a href="https://github.com/bishalsarkar246800-spec/ai-operating-system-for-teams/actions"><img src="https://github.com/bishalsarkar246800-spec/ai-operating-system-for-teams/actions/workflows/ci.yml/badge.svg" alt="CI Suite" /></a>
    <img src="https://img.shields.io/badge/version-v1.0.0-blue.svg?style=flat-square" alt="Version" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="License" /></a>
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Docker-lightgrey.svg?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/Air--Gapped-Zero%20Data%20Egress-success?style=flat-square" alt="Air-Gapped Privacy" />
  </p>

  <!-- Badges Row 2: Frameworks & Tech Stack -->
  <p>
    <img src="https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js" alt="Next.js 14" />
    <img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" alt="React 18" />
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python" alt="Python 3.11+" />
    <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwindcss" alt="TailwindCSS" />
  </p>

  <!-- Badges Row 3: Engines & Storage -->
  <p>
    <img src="https://img.shields.io/badge/React%20Flow-12.3-FF0072?style=flat-square&logo=react" alt="React Flow" />
    <img src="https://img.shields.io/badge/NetworkX-DAG%20Engine-1F77B4?style=flat-square" alt="NetworkX" />
    <img src="https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Redis-Pub%2FSub-DC382D?style=flat-square&logo=redis" alt="Redis" />
    <img src="https://img.shields.io/badge/SQLAlchemy-2.0-red?style=flat-square" alt="SQLAlchemy 2.0" />
  </p>

</div>

---

## 📸 Interactive Workspace Canvas Preview

<p align="center">
  <img src="assets/preview.png" alt="AI Teams OS Interactive Dashboard Preview" width="100%" style="border-radius: 8px; border: 2px solid #000; box-shadow: 6px 6px 0px 0px #000;" />
</p>

> [!TIP]
> **Zero Third-Party Data Leakage Guaranteed**: AI Teams OS features an integrated **Air-Gapped Mode** (`AIR_GAPPED_MODE=true`). Brief decomposition, semantic task matching, and transitive risk cascading run 100% on-premises using deterministic 128-dimensional n-gram feature hashing and local heuristic DAG parsing—no sensitive corporate data ever leaves your servers.

---

## What is AI Teams OS?

**AI Teams OS** is an open-source, multi-tenant workspace platform engineered for fast-moving engineering, product, and design organizations. It closes the critical gap between unstructured team chatter (Slack, Discord, meeting transcripts) and rigid project management trackers.

By continuously parsing launch briefs and team updates into live directed acyclic graphs (DAGs), AI Teams OS:
- **Detects blockers at inception**: Semantic matching flags dependencies affected by delayed updates before milestones slip.
- **Cascades downstream impact**: Uses `networkx.descendants()` to calculate cumulative schedule drift and critical-path shifts.
- **Guards deadlines with HITL**: AI agents draft surgical remedial interventions that only execute upon explicit human approval with immutable audit logs.

---

## ✨ Core Capabilities

### 1. 🧠 Unstructured Brief Decomposition (`/api/decompose`)
- Ingests raw markdown, PRD drafts, feature specs, or unstructured launch briefs.
- Deconstructs content into concrete work items across four core disciplines: **Engineering**, **Product**, **Design**, and **Marketing**.
- Automatically establishes directed edges (`source_task_id -> target_task_id`) along with explicit dependency reasoning.
- Validates graph acyclicity (`networkx.is_directed_acyclic_graph`) and assigns 2D canvas coordinates using hierarchical DAG topological layering.

### 2. ⚡ Workspace Semantic Index & Event Ingestion (`/api/events/ingest`)
- Vectors workspace task titles and descriptions.
- When team updates or chat messages arrive (e.g., *"Auth migration delayed by 3 days due to OAuth credential refresh"*), the system uses semantic retrieval to pin the exact task node.
- Extracts delay magnitude, sentiment severity, and blocker flags.

### 3. 🕸️ Downstream Dependency Risk Propagation
- Employs `networkx.descendants()` to traverse transitive dependencies.
- When a node is flagged `blocked` or `at_risk`, the delay propagates downstream:
  $$\text{Cumulative Delay}(\text{child}) = \max_{\text{parents}}(\text{Delay}(\text{parent})) + \text{Local Delay}$$
- Recomputes critical paths and pushes live status cascades to all connected clients over WebSockets.

### 4. 🛡️ Human-in-the-Loop (HITL) Action Approval Gateway
- AI agents do **not** mutate deadlines or external systems autonomously.
- Proposes structured `AgentAction` drafts (e.g., *"Shift Mobile Launch by 3 days"*, *"Notify Design Lead of blocker"*).
- Exposes `/api/actions/{id}/approve` and `/api/actions/{id}/reject` with full audit logs tracking actor, timestamp, and delta.

### 5. 🎨 Neo-Brutalist DevTool Canvas & Dual Views
- High-contrast, sharp visual canvas with custom `@xyflow/react` task nodes.
- **Dual Visual Modes**:
  - 🗺 **DAG Canvas**: Interactive node-graph canvas with zoom, pan, minimap, domain filter pills (Engineering, Design, Product, Marketing), and critical-path highlighting.
  - 📊 **Timeline Schedule**: Horizontal Gantt-style schedule view computing task bounding dates and dependency lags.
- **Task Inspector**: Click any task card to open the detailed inspector showing prerequisites, downstream deliverables, owner, duration, delay diagnostics, and manual status/delay overrides.
- **Multi-Tenant Workspace Selector**: Switch between different projects or create new workspaces with isolated graphs and activity streams.

---

## 🏛 System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 14 + React Flow)"]
        Canvas["Interactive DAG Canvas (@xyflow/react)"]
        Timeline["Gantt Timeline Schedule View"]
        Metrics["Top Metrics & Health Banner"]
        Activity["Activity Feed & Mock Team Chat"]
        Approval["HITL Action Approval Drawer"]
        WSClient["WebSocket Client Hook"]
    end

    subgraph API ["Backend (FastAPI)"]
        Decomp["/api/decompose (Brief Parser)"]
        Ingest["/api/events/ingest (Event Semantic Router)"]
        Actions["/api/actions (HITL Gateway)"]
        Workspaces["/api/workspaces (Tenant Manager)"]
        WSHub["WebSocket Broadcast Hub & Redis Pub/Sub"]
        GraphEngine["NetworkX DAG & Risk Engine"]
    end

    subgraph Storage ["Persistence Layer"]
        PG[("PostgreSQL + pgvector / SQLite")]
        Redis[("Redis Event Queue")]
    end

    Canvas <-->|REST & WS| WSHub
    Timeline <-->|State Sync| WSHub
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

## ⚡ Quickstart Guide

### Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js 18+** (Node 20+ recommended)
- **Docker & Docker Compose** (optional, for PostgreSQL/Redis)

### Option 1: One-Click Startup Script (Recommended)
```bash
# Clone the repository
git clone https://github.com/bishalsarkar246800-spec/ai-operating-system-for-teams.git
cd ai-operating-system-for-teams

# Run the unified start script (sets up virtualenv, installs deps, starts both services)
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
Backend API will be live at: `http://localhost:8000` (Interactive Swagger docs at `/docs`)

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend UI will be accessible at: `http://localhost:3000`

---

## 🧪 Testing & Verification

The repository includes a comprehensive automated test suite covering graph theory algorithms, end-to-end integration flows, air-gapped privacy, and multi-tenant security isolation.

### One-Command Test Runner
```bash
./start.sh test
```

### Manual Test Execution
```bash
# Backend unit & security tests
cd backend
.venv/bin/python3 -m unittest tests/test_engine.py tests/test_graph_engine.py tests/test_security_isolation.py

# Frontend TypeScript type verification
cd frontend
npm test
```

#### Test Suite Breakdown (12 Tests Passing):
| Test Module | Test Case | Target Capability | Result |
| :--- | :--- | :--- | :--- |
| **`test_graph_engine.py`** | `test_dag_acyclicity` | Verifies NetworkX DAG acyclicity | **PASSED** |
| | `test_cycle_detection` | Detects cycles and isolates illegal feedback edges | **PASSED** |
| | `test_critical_path` | Longest-path dynamic programming on topological sort | **PASSED** |
| | `test_descendant_risk_propagation` | Verifies `networkx.descendants()` cascades delays downstream | **PASSED** |
| | `test_dag_layout_generation` | Topological tier coordinate generation for React Flow | **PASSED** |
| **`test_engine.py`** | `test_end_to_end_engine` | Module A $\to$ B $\to$ C $\to$ D end-to-end integration pipeline | **PASSED** |
| **`test_security_isolation.py`** | `test_tenant_workspace_isolation` | Verifies Tenant B cannot view or mutate Tenant A tasks | **PASSED** |
| | `test_sql_injection_resistance` | Verifies resilience against SQL injection payloads | **PASSED** |
| | `test_action_isolation` | Prevents unauthorized cross-tenant HITL action approvals | **PASSED** |
| | `test_cross_tenant_event_containment` | Confirms delay events in Tenant A never contaminate Tenant B | **PASSED** |
| | `test_multi_workspace_seeding_isolation` | Non-colliding task prefixing prevents cross-workspace bleed | **PASSED** |
| | `test_security_headers_enforcement` | Enforces defense-in-depth HTTP security headers | **PASSED** |
| | `test_air_gapped_privacy_mode` | Confirms zero external data egress in air-gapped mode | **PASSED** |
| **Frontend** | `npm test` (`tsc --noEmit`) | Strict TypeScript validation across all React components | **PASSED (0 Errors)** |

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

## 🛡️ Privacy & Security Architecture

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

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## 📄 License & Contributing

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/bishalsarkar246800-spec/ai-operating-system-for-teams/issues).

<p align="center">
  <sub>Built with ❤️ by Bishal Sarkar for high-velocity teams.</sub>
</p>
