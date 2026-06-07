#!/bin/bash
# Inicia BOLTRAIN: backend en :5000 y frontend en :5173

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🌿 Iniciando BOLTRAIN..."

# Backend
cd "$ROOT/server"
npm run dev &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID $BACKEND_PID) → http://localhost:5000"

# Frontend
cd "$ROOT/client"
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend iniciado (PID $FRONTEND_PID) → http://localhost:5173"

echo ""
echo "   App disponible en: http://localhost:5173"
echo "   Presioná Ctrl+C para detener ambos servicios"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo 'BOLTRAIN detenido.'" SIGINT SIGTERM
wait
