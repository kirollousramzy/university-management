#!/bin/bash

# Database setup script
# This script will create the database and run the schema

echo "Setting up MySQL database..."

# Default MySQL connection (adjust if needed)
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"

# Check if password is provided
if [ -z "$DB_PASSWORD" ]; then
    echo "Note: Using MySQL without password. If you have a password, set DB_PASSWORD environment variable."
    MYSQL_CMD="mysql -u $DB_USER -h $DB_HOST -P $DB_PORT"
else
    MYSQL_CMD="mysql -u $DB_USER -p$DB_PASSWORD -h $DB_HOST -P $DB_PORT"
fi

# Run the schema
echo "Running schema.sql..."
$MYSQL_CMD < schema.sql

if [ $? -eq 0 ]; then
    echo "✓ Database setup completed successfully!"
else
    echo "✗ Database setup failed. Please check your MySQL connection."
    echo "Make sure MySQL is running: brew services start mysql (or sudo systemctl start mysql)"
    exit 1
fi

