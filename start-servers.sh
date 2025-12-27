#!/bin/bash

# Startup script for University Management System
# This script starts both backend and frontend servers

echo "🚀 Starting University Management System..."
echo ""

# Set MySQL password
export DB_PASSWORD=Kiro12345678

# Kill any existing processes on these ports
echo "Clearing ports..."
lsof -ti:4000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 2

# Start backend
echo "📡 Starting backend server..."
cd "$(dirname "$0")/backend"
npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo "   Backend API: http://localhost:4000"
echo "   Logs: tail -f /tmp/backend.log"
echo ""

# Wait for backend to start
sleep 3

# Check if backend started successfully
if curl -s http://localhost:4000/ > /dev/null 2>&1; then
    echo "   ✓ Backend is running and connected to MySQL"
else
    echo "   ✗ Backend failed to start. Check /tmp/backend.log"
    echo "   Error log:"
    tail -5 /tmp/backend.log
    exit 1
fi

echo ""

# Start frontend
echo "🎨 Starting frontend server..."
cd "../frontend"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
echo "   Frontend: http://localhost:5173"
echo "   Logs: tail -f /tmp/frontend.log"
echo ""

# Wait for frontend to start
sleep 5

# Check if frontend started
if curl -s http://localhost:5173/ > /dev/null 2>&1; then
    echo "   ✓ Frontend is running"
else
    echo "   ⚠️  Frontend may still be starting..."
fi

echo ""
echo "✅ Both servers are starting!"
echo ""
echo "📊 Access the application at: http://localhost:5173"
echo ""
echo "🔑 Login credentials:"
echo "   Admin: admin@campus.edu / admin123"
echo "   Doctor: doctor@campus.edu / doctor123"
echo "   Advisor: advisor@campus.edu / advisor123"
echo "   Student: student@campus.edu / student123"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   Or: lsof -ti:4000,5173 | xargs kill -9"
echo ""
echo "📝 View logs:"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""

# Keep script running
wait

