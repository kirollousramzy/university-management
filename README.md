## CampusFlow – University Management System

A comprehensive full-stack University Management System built with Node.js/Express backend and React frontend. The system implements all four major modules: Facilities, Curriculum, Staff, and Community, with an EAV (Entity-Attribute-Value) model for flexible data storage and change anticipation.

### Features

#### 🏢 Facilities Module
- **Classroom & Laboratory Management**: View and manage all university facilities
- **Room Booking System**: Book facilities with conflict detection and time-slot management
- **Maintenance Requests**: Report and track facility maintenance issues
- **Resource Allocation**: Manage equipment, software licenses, and other resources
- **Admission Applications**: Handle student admission applications

#### 📚 Curriculum Module
- **Course Management**: Create and manage courses with core/elective distinction
- **Assignment System**: Create assignments, quizzes, exams, and projects
- **Submission & Grading**: Students submit assignments, professors grade with feedback
- **LMS Features**: Full learning management system capabilities

#### 👥 Staff Module
- **Teaching Assistant Management**: Assign and manage TAs for courses
- **Office Hours**: Set and view staff office hours
- **Performance Tracking**: Record and track staff performance evaluations
- **Research Publications**: Track faculty research publications
- **Professional Development**: Manage training, conferences, and workshops
- **Leave Management**: Request and approve staff leave requests

#### 🌐 Community Module
- **Messaging System**: Direct messaging between students and staff
- **Meeting Scheduling**: Request and confirm meetings with professors
- **Events Management**: Create and view campus events
- **Parent Portal**: Foundation for parent-teacher communication

#### 🔧 Core Features
- **Student Management**: Complete CRUD operations for student records
- **Course Enrollment**: Manage student course enrollments with limits
- **Grade Management**: Publish grades and calculate GPAs
- **Dashboard**: Overview with statistics and announcements
- **EAV Model**: Flexible data storage for future requirements

### Project Structure
```
backend/   → Express API (port 4000)
frontend/  → React dashboard (Vite dev server on port 5173)
```

### Backend – Express API
```bash
cd backend
npm install          # already run once but required after clean checkout
npm start            # starts http://localhost:4000
```

**Key API Endpoints (50+ endpoints available):**

**Authentication:**
- `POST /api/auth/login`

**Students:**
- `GET/POST/PUT/DELETE /api/students`
- `GET /api/students/:id/transcript`
- `POST /api/students/:id/auto-enroll-defaults`

**Courses:**
- `GET/POST/PUT/DELETE /api/courses`
- `GET /api/schedule`

**Enrollments:**
- `GET/POST/PUT/DELETE /api/enrollments`

**Facilities:**
- `GET/POST /api/facilities`
- `GET/POST /api/facilities/bookings`
- `GET/POST /api/facilities/maintenance`
- `GET/POST /api/resources`
- `POST /api/resources/allocate`
- `GET/POST /api/admissions/applications`

**Assignments:**
- `GET/POST /api/assignments`
- `GET/POST /api/assignments/:id/submit`
- `PUT /api/assignments/submissions/:id/grade`

**Staff:**
- `GET/POST /api/staff/tas`
- `GET/POST /api/staff/office-hours`
- `GET/POST /api/staff/performance`
- `GET/POST /api/staff/research`
- `GET/POST /api/staff/development`
- `GET/POST /api/staff/leave-requests`

**Community:**
- `GET/POST /api/messages`
- `GET/POST /api/meetings`
- `GET/POST /api/events`
- `GET/POST /api/parents`

**EAV Model:**
- `GET /api/eav/entity-types`
- `GET/POST/PUT/DELETE /api/eav/attributes`
- `GET/POST/PUT/DELETE /api/eav/values`

### Database Setup (MySQL)

The application uses MySQL for data persistence. Before starting the backend, you need to set up the database:

1. **Make sure MySQL is running:**
   ```bash
   # macOS with Homebrew
   brew services start mysql
   
   # Or check if MySQL is running
   mysql -u root -e "SELECT 1"
   ```

2. **Set up the database schema:**
   ```bash
   cd backend
   
   # If you have a MySQL password, set it:
   export DB_PASSWORD=yourpassword
   
   # Run the schema (adjust user/password as needed)
   mysql -u root -p < schema.sql
   # Or if no password:
   mysql -u root < schema.sql
   ```

3. **Configure database connection (optional):**
   The backend uses environment variables for database configuration:
   ```bash
   export DB_HOST=localhost
   export DB_PORT=3306
   export DB_USER=root
   export DB_PASSWORD=yourpassword
   export DB_NAME=university
   ```

   Default values are used if not set (localhost:3306, user: root, no password, database: university).

### EAV Model

The system includes an Entity-Attribute-Value (EAV) model for flexible data storage:

**EAV API Endpoints:**
- `GET /api/eav/entity-types` - Get all entity types
- `GET /api/eav/attributes/:entityType` - Get attributes for an entity type
- `POST /api/eav/attributes` - Create a new attribute
- `GET /api/eav/attributes/id/:id` - Get attribute by ID
- `PUT /api/eav/attributes/:id` - Update attribute
- `DELETE /api/eav/attributes/:id` - Delete attribute
- `GET /api/eav/values/:entityType/:entityId` - Get values for an entity
- `POST /api/eav/values/:entityType/:entityId` - Set multiple values
- `PUT /api/eav/values/:entityType/:entityId/:attributeId` - Set single value
- `DELETE /api/eav/values/:entityType/:entityId/:attributeId` - Delete value

**Example Usage:**
```javascript
// Create an attribute for students
POST /api/eav/attributes
{
  "entityType": "students",
  "attributeName": "phone_number",
  "dataType": "string",
  "description": "Student phone number"
}

// Set a value for a student
POST /api/eav/values/students/stu-001
{
  "values": {
    "phone_number": "+1234567890"
  }
}

// Get all values for a student
GET /api/eav/values/students/stu-001?format=object
```

### Frontend – React Dashboard
```bash
cd frontend
npm install          # install deps
npm run dev          # opens http://localhost:5173 (Vite)
```

The UI expects the backend to run on `http://localhost:4000`. Override the API location by setting `VITE_API_URL` before starting Vite.

### Sample Credentials
- Admin: `admin@campus.edu / admin123`
- Doctor: `doctor@campus.edu / doctor123`
- Advisor: `advisor@campus.edu / advisor123`
- Student: `student@campus.edu / student123`

These are mock accounts kept in memory alongside the rest of the data. Student accounts link directly to a portal view that shows their enrollments and personal schedule; staff roles land on the operations dashboard with access to roster, catalog, and scheduling tools. Administrators can create new student profiles (Students page) and new doctor accounts (Staff page) while issuing temporary passwords directly from the UI—any account created there can log in immediately with the provided credentials.
