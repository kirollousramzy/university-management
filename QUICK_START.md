# Quick Start Guide

## ✅ Current Status

Your servers are now running:

- **Backend API**: http://localhost:4000 ✅ Running
- **Frontend**: http://localhost:5173 (check if running)
- **MySQL**: Connected ✅

## 🚀 Access the Application

1. **Open your browser** and go to: http://localhost:5173

2. **Login with sample credentials:**
   - Admin: `admin@campus.edu` / `admin123`
   - Doctor: `doctor@campus.edu` / `doctor123`
   - Advisor: `advisor@campus.edu` / `advisor123`
   - Student: `student@campus.edu` / `student123`

## 📊 Test the API

You can test the backend API directly:

```bash
# Health check
curl http://localhost:4000/

# Dashboard summary
curl http://localhost:4000/api/dashboard/summary

# Get students
curl http://localhost:4000/api/students

# Test EAV model
curl http://localhost:4000/api/eav/entity-types
```

## 🗄️ Database Setup (if needed)

If you need to reset or set up the database:

```bash
cd backend

# Set MySQL password if needed
export DB_PASSWORD=yourpassword

# Run schema
mysql -u root -p < schema.sql
# Or without password:
mysql -u root < schema.sql
```

## 🛑 Stop Servers

To stop the servers, you can:

1. Find the processes:
   ```bash
   lsof -ti:4000  # Backend
   lsof -ti:5173  # Frontend
   ```

2. Kill them:
   ```bash
   kill $(lsof -ti:4000)
   kill $(lsof -ti:5173)
   ```

Or use Ctrl+C in the terminal where they're running.

## 🔧 EAV Model Usage

The EAV (Entity-Attribute-Value) model allows you to add custom attributes to entities:

### Example: Add phone number to students

1. **Create attribute:**
   ```bash
   curl -X POST http://localhost:4000/api/eav/attributes \
     -H "Content-Type: application/json" \
     -d '{
       "entityType": "students",
       "attributeName": "phone_number",
       "dataType": "string",
       "description": "Student phone number"
     }'
   ```

2. **Set value for a student:**
   ```bash
   curl -X POST http://localhost:4000/api/eav/values/students/stu-001 \
     -H "Content-Type: application/json" \
     -d '{
       "values": {
         "phone_number": "+1234567890"
       }
     }'
   ```

3. **Get values:**
   ```bash
   curl http://localhost:4000/api/eav/values/students/stu-001?format=object
   ```

## 📝 Environment Variables

You can configure the backend with environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=yourpassword
export DB_NAME=university
export PORT=4000
```

## 🐛 Troubleshooting

### MySQL Connection Issues

1. **Check if MySQL is running:**
   ```bash
   mysql -u root -e "SELECT 1"
   ```

2. **Start MySQL (macOS):**
   ```bash
   brew services start mysql
   ```

3. **Check MySQL socket:**
   ```bash
   mysql_config --socket
   ```

### Backend not starting

- Check if port 4000 is already in use
- Verify MySQL connection settings
- Check backend logs for errors

### Frontend not loading

- Make sure backend is running on port 4000
- Check browser console for errors
- Verify `VITE_API_URL` if using custom backend URL

