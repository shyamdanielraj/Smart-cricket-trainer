#!/bin/bash
set -e

echo "🔹 Cleaning old processes..."

kill_port () {
  PORT_TO_KILL=$1
  PID=$(lsof -ti:$PORT_TO_KILL 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "⚠️  Killing process on port $PORT_TO_KILL (PID $PID)"
    kill -9 $PID 2>/dev/null || true
  fi
}

kill_port 5001
kill_port 5050
kill_port 5173

echo "🔹 Starting Smart-Cricket project..."

# --------- Python service ---------
echo "➡️  Python service..."
cd python-service

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate

if [ ! -f "requirements_installed.flag" ]; then
    pip install -r requirements.txt
    touch requirements_installed.flag
fi

PORT=5001 nohup python app.py > python.log 2>&1 &
deactivate
cd ..

# --------- Node server ---------
echo "➡️  Node server..."
cd server

if [ ! -d "node_modules" ]; then
    npm install
fi

nohup npm run dev > server.log 2>&1 &
cd ..

# --------- Client ---------
echo "➡️  Client..."
cd client

if [ ! -d "node_modules" ]; then
    npm install
fi

nohup npm run dev > client.log 2>&1 &
cd ..

echo "✅ All services started!"
echo "🌐 Frontend: http://localhost:5173"
echo "⚙️ Backend: http://localhost:5050"
echo "🤖 ML API: http://localhost:5001"