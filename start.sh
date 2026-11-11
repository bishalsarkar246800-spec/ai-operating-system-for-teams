#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=========================================================="
echo "  🚀 AI OPERATING SYSTEM FOR TEAMS (OS TEAMS) STARTUP    "
echo "=========================================================="

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is required but not found."
    exit 1
fi

# 2. Check Node & npm
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is required but not found."
    exit 1
fi

# 3. Setup Backend Virtual Environment if needed
if [ ! -d "backend/.venv" ]; then
    echo "📦 Creating backend virtual environment..."
    python3 -m venv backend/.venv
    backend/.venv/bin/pip install --upgrade pip
    backend/.venv/bin/pip install -r backend/requirements.txt
fi

# 4. Setup Frontend node_modules if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend npm dependencies..."
    npm install --prefix frontend
fi

# Trap to cleanly kill both processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down AI Teams OS services..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 5. Start Backend
echo "⚡ Starting FastAPI Backend on port 8000..."
(
    cd backend
    .venv/bin/python3 main.py
) &
BACKEND_PID=$!

# Wait for backend to become healthy
echo "⏳ Waiting for Backend to be ready..."
for i in {1..15}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✔ Backend is healthy at http://localhost:8000"
        break
    fi
    sleep 1
done

# 6. Start Frontend
echo "⚡ Starting Next.js Frontend on port 3000..."
(
    cd frontend
    npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "  🎉 AI TEAMS OS IS LIVE AND RUNNING!"
echo "  🌐 Frontend UI:           http://localhost:3000"
echo "  📡 Backend API:           http://localhost:8000"
echo "  📚 Swagger API Docs:      http://localhost:8000/docs"
echo "  🔌 WebSocket Endpoint:    ws://localhost:8000/ws/apex-launch"
echo "=========================================================="
echo "  Press Ctrl+C to terminate all services."
echo ""

wait
