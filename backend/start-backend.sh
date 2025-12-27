#!/bin/bash

# Backend startup script with MySQL password handling

echo "Starting University Management Backend..."

# Check if MySQL password is set
if [ -z "$DB_PASSWORD" ]; then
    echo ""
    echo "⚠️  MySQL password not set in DB_PASSWORD environment variable"
    echo "   Attempting to connect without password..."
    echo ""
    echo "   If connection fails, set your MySQL password:"
    echo "   export DB_PASSWORD=yourpassword"
    echo ""
fi

# Start the server
cd "$(dirname "$0")"
node src/server.js

