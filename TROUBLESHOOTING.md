# Troubleshooting Guide

## "Request Failed" Error

If you're seeing "Request failed" errors in the frontend, check the following:

### 1. Backend Server Status

Check if the backend is running:
```bash
curl http://localhost:4000/
```

Expected response: `{"status":"ok","service":"University Management API"}`

If not responding, start the backend:
```bash
cd backend
npm start
```

### 2. MySQL Connection

The backend needs to connect to MySQL. Check your MySQL connection:

```bash
# Test MySQL connection (adjust password as needed)
mysql -u root -p -e "SELECT 1"
```

If MySQL requires a password, set it before starting the backend:
```bash
export DB_PASSWORD=yourpassword
cd backend
npm start
```

### 3. Database Setup

Make sure the database and tables exist:

```bash
cd backend

# If you have a MySQL password:
mysql -u root -p < schema.sql

# Or without password:
mysql -u root < schema.sql
```

### 4. CORS Issues

If you see CORS errors in the browser console:
- Make sure the backend is running on port 4000
- Make sure the frontend is running on port 5173
- Check browser console for specific error messages

### 5. Check Backend Logs

The backend will show connection errors in the terminal. Look for:
- "Connected to MySQL" - Good!
- "Failed to connect to MySQL" - Check your MySQL credentials
- Any error messages about database queries

### 6. Environment Variables

You can configure the backend with environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=yourpassword
export DB_NAME=university
export PORT=4000
export FRONTEND_URL=http://localhost:5173
```

### 7. Common Issues

**Issue: "Access denied for user 'root'@'localhost'"**
- Solution: Set `DB_PASSWORD` environment variable with your MySQL password

**Issue: "Can't connect to MySQL server"**
- Solution: Make sure MySQL is running:
  ```bash
  # macOS with Homebrew
  brew services start mysql
  
  # Or check status
  brew services list | grep mysql
  ```

**Issue: "Database 'university' doesn't exist"**
- Solution: Run the schema.sql file to create the database

**Issue: Frontend shows "Request failed" but backend works**
- Check browser console (F12) for specific error messages
- Verify the API_BASE_URL in frontend/src/api/client.js
- Make sure CORS is properly configured

### 8. Restart Everything

If nothing works, try a clean restart:

```bash
# Kill all node processes
lsof -ti:4000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Start backend
cd backend
export DB_PASSWORD=yourpassword  # if needed
npm start

# In another terminal, start frontend
cd frontend
npm run dev
```

### 9. Get More Detailed Errors

Check the browser's Developer Console (F12):
- Go to Console tab to see JavaScript errors
- Go to Network tab to see failed API requests
- Check the Response tab for error details

### 10. Test API Directly

Test the backend API directly with curl:

```bash
# Health check
curl http://localhost:4000/

# Dashboard (should return data)
curl http://localhost:4000/api/dashboard/summary

# Login test
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.edu","password":"admin123"}'
```

If these work but the frontend doesn't, it's likely a CORS or frontend configuration issue.

