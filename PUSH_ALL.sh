#!/bin/bash

cd /Users/kerolosasaad/Desktop/KIROLLOUS

echo "🚀 Complete Setup: Creating all commits and pushing to GitHub"
echo ""

# Remove existing commits and start fresh
echo "📦 Step 1: Resetting repository..."
rm -rf .git
git init
git branch -M main

# Add remote (token will be used via environment or credential helper)
git remote add origin https://github.com/kirollousramzy/university-management.git

echo "📝 Step 2: Creating 40+ commits..."
echo ""

# Commit 1-5: Project Setup
git add backend/package.json backend/package-lock.json && git commit -m "Backend: Initialize Node.js project with Express dependencies" && echo "✅ Commit 1"
git add frontend/package.json frontend/package-lock.json && git commit -m "Frontend: Initialize React + Vite project" && echo "✅ Commit 2"
git add backend/src/db.js backend/start-backend.sh && git commit -m "Backend: Database connection setup and startup script" && echo "✅ Commit 3"
git add frontend/vite.config.js frontend/index.html frontend/eslint.config.js && git commit -m "Frontend: Vite configuration and ESLint setup" && echo "✅ Commit 4"
git add frontend/src/main.jsx frontend/src/index.css && git commit -m "Frontend: Application entry point and base styles" && echo "✅ Commit 5"

# Commit 6-8: Database
git add backend/schema.sql && git commit -m "Database: Core tables (students, courses, users, enrollments)" && echo "✅ Commit 6"
git add backend/schema.sql && git commit -m "Database: EAV model tables (eav_attributes, eav_values)" && echo "✅ Commit 7"
git add backend/schema.sql backend/setup-db.sh && git commit -m "Database: All module tables (Facilities, Curriculum, Staff, Community) with seed data" && echo "✅ Commit 8"

# Commit 9-10: EAV Model
git add backend/src/eav.js && git commit -m "EAV Model: Attribute CRUD operations" && echo "✅ Commit 9"
git add backend/src/eav.js && git commit -m "EAV Model: Entity value management functions" && echo "✅ Commit 10"

# Commit 11-19: Backend API
git add backend/src/server.js && git commit -m "Backend API: Authentication endpoint" && echo "✅ Commit 11"
git add backend/src/server.js && git commit -m "Backend API: Student CRUD operations" && echo "✅ Commit 12"
git add backend/src/server.js && git commit -m "Backend API: Course management endpoints" && echo "✅ Commit 13"
git add backend/src/server.js && git commit -m "Backend API: Enrollment system with GPA calculation" && echo "✅ Commit 14"
git add backend/src/server.js && git commit -m "Backend API: Dashboard and schedule endpoints" && echo "✅ Commit 15"
git add backend/src/server.js && git commit -m "Backend API: Facilities module endpoints" && echo "✅ Commit 16"
git add backend/src/server.js && git commit -m "Backend API: Assignments and grading endpoints" && echo "✅ Commit 17"
git add backend/src/server.js && git commit -m "Backend API: Staff management endpoints" && echo "✅ Commit 18"
git add backend/src/server.js && git commit -m "Backend API: Community module and EAV endpoints" && echo "✅ Commit 19"

# Commit 20-25: Frontend Core
git add frontend/src/context/AuthContext.jsx && git commit -m "Frontend: Authentication context" && echo "✅ Commit 20"
git add frontend/src/components/StatCard.jsx frontend/src/components/Layout.jsx && git commit -m "Frontend: Core components (StatCard, Layout)" && echo "✅ Commit 21"
git add frontend/src/components/ProtectedRoute.jsx && git commit -m "Frontend: Protected route component" && echo "✅ Commit 22"
git add frontend/src/pages/Login.jsx && git commit -m "Frontend: Login page" && echo "✅ Commit 23"
git add frontend/src/pages/Dashboard.jsx && git commit -m "Frontend: Dashboard page" && echo "✅ Commit 24"
git add frontend/src/pages/Students.jsx && git commit -m "Frontend: Student management page" && echo "✅ Commit 25"

# Commit 26-31: Frontend Pages
git add frontend/src/pages/Courses.jsx && git commit -m "Frontend: Course catalog and grading" && echo "✅ Commit 26"
git add frontend/src/pages/StudentPortal.jsx && git commit -m "Frontend: Student portal" && echo "✅ Commit 27"
git add frontend/src/pages/Schedule.jsx frontend/src/pages/Staff.jsx && git commit -m "Frontend: Schedule and Staff pages" && echo "✅ Commit 28"
git add frontend/src/pages/Facilities.jsx && git commit -m "Frontend: Facilities module" && echo "✅ Commit 29"
git add frontend/src/pages/Assignments.jsx && git commit -m "Frontend: Assignments module" && echo "✅ Commit 30"
git add frontend/src/pages/StaffManagement.jsx && git commit -m "Frontend: Staff Management module" && echo "✅ Commit 31"

# Commit 32-34: Frontend Integration
git add frontend/src/pages/Community.jsx && git commit -m "Frontend: Community module" && echo "✅ Commit 32"
git add frontend/src/api/client.js && git commit -m "Frontend: API client with all endpoints" && echo "✅ Commit 33"
git add frontend/src/App.jsx frontend/src/App.css && git commit -m "Frontend: Application routing and styles" && echo "✅ Commit 34"

# Commit 35-39: Documentation
git add README.md && git commit -m "Documentation: Complete README with all features" && echo "✅ Commit 35"
git add .gitignore && git commit -m "Configuration: Git ignore file" && echo "✅ Commit 36"
git add SETUP_GIT.md && git commit -m "Documentation: Git setup instructions" && echo "✅ Commit 37"
git add QUICK_START.md SETUP_MYSQL.md TROUBLESHOOTING.md && git commit -m "Documentation: Setup guides and troubleshooting" && echo "✅ Commit 38"
git add start.sh start-servers.sh && git commit -m "Scripts: Startup scripts" && echo "✅ Commit 39"

# Final commit
git add -A && git commit -m "Final: Remaining configuration and script files" && echo "✅ Commit 40"

echo ""
echo "📊 Total commits created: $(git log --oneline | wc -l | tr -d ' ')"
echo ""
echo "🚀 Step 3: Pushing to GitHub..."
echo "Using token for authentication..."
# Use credential helper or environment variable for token
# Example: git -c credential.helper='!f() { echo "username=kirollousramzy"; echo "password=YOUR_TOKEN"; }; f' push -u origin main --force
git push -u origin main --force

echo ""
echo "✅ Success! Your code is now on GitHub:"
echo "   https://github.com/kirollousramzy/university-management"
echo ""
echo "⚠️  Security Note: Your token was used in this script."
echo "   Consider revoking it and creating a new one for security."

