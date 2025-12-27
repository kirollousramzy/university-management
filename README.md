# University Management System

A comprehensive full-stack University Management System with Facilities, Curriculum, Staff, and Community modules.

## Quick Start

### Prerequisites
- Node.js (v14+)
- MySQL

### Setup

1. **Database Setup:**
   ```bash
   cd backend
   mysql -u root -p < schema.sql
   ```

2. **Install Dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Run the Application:**
   ```bash
   # From root directory
   ./start-servers.sh
   
   # Or manually:
   # Terminal 1 - Backend (port 4000)
   cd backend && npm start
   
   # Terminal 2 - Frontend (port 5173)
   cd frontend && npm run dev
   ```

4. **Access the Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000

### Default Credentials
- Admin: `admin@campus.edu` / `admin123`
- Doctor: `doctor@campus.edu` / `doctor123`
- Advisor: `advisor@campus.edu` / `advisor123`
- Student: `student@campus.edu` / `student123`

## Features

- **Facilities Module**: Room booking, maintenance, resource allocation
- **Curriculum Module**: Courses, assignments, grading
- **Staff Module**: TA management, office hours, performance tracking
- **Community Module**: Messaging, meetings, events
- **EAV Model**: Flexible data storage for future requirements

## Project Structure

```
backend/     # Express.js API server
frontend/    # React + Vite application
```

## API Endpoints

See `backend/src/server.js` for all available endpoints.
