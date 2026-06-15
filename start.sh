#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Starting EIPR-Agent..."

echo "Starting backend..."
source "$DIR/backend/.venv/bin/activate"
"$DIR/backend/.venv/bin/uvicorn" main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend running on http://localhost:8000 (PID: $BACKEND_PID)"

echo "Starting frontend..."
cd "$DIR/frontend" && npm run dev &
FRONTEND_PID=$!
echo "Frontend running on http://localhost:3000 (PID: $FRONTEND_PID)"

echo ""
echo "EIPR-Agent is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/api/docs"
echo "  MLflow: http://localhost:5000 (run 'make mlops')"
echo "  Grafana: http://localhost:3001 admin/admin (run 'make mlops')"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
