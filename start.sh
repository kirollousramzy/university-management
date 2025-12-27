#!/bin/bash

# Start script for the University Management System
# This will start both backend and frontend servers

echo "Starting University Management System..."
echo ""

# Check if MySQL is accessible
echo "Checking MySQL connection..."
cd backend
if [ -z "$DB_PASSWORD" ]; then
    mysql -u root -e "SELECT 1" > /dev/null 2>&1
else
    mysql -u root -p"$DB_PASSWORD" -e "SELECT 1" > /dev/null 2>&1
fi

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Could not connect to MySQL."
    echo "   Please make sure MySQL is running:"
    echo "   - macOS: brew services start mysql"
    echo "   - Or start MySQL manually"
    echo ""
    echo "   You can also set DB_PASSWORD if needed:"
    echo "   export DB_PASSWORD=yourpassword"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start backend in background
echo "Starting backend server..."
cd backend
npm install > /dev/null 2>&1
npm start &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"
echo "Backend API: http://localhost:4000"
echo ""

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "Starting frontend server..."
cd ../frontend
npm install > /dev/null 2>&1
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"
echo "Frontend: http://localhost:5173"
echo ""

echo "✓ Both servers are running!"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

