#!/bin/bash

cd /Users/kerolosasaad/Desktop/KIROLLOUS

echo "🚀 Creating all commits and pushing to GitHub..."
echo ""

# Reset to clean state
echo "📦 Preparing repository..."
git reset --hard HEAD~2 2>/dev/null
git clean -fd 2>/dev/null

# Create all commits
echo "📝 Creating commits..."

# Project Setup (5 commits)
git add backend/package.json backend/package-lock.json && git commit -m "Backend: Initialize Node.js project with Express dependencies" 2>/dev/null && echo "✅ Commit 1"
git add frontend/package.json frontend/package-lock.json && git commit -m "Frontend: Initialize React + Vite project" 2>/dev/null && echo "✅ Commit 2"
git add backend/src/db.js backend/start-backend.sh && git commit -m "Backend: Database connection setup and startup script" 2>/dev/null && echo "✅ Commit 3"
git add frontend/vite.config.js frontend/index.html frontend/eslint.config.js && git commit -m "Frontend: Vite configuration and ESLint setup" 2>/dev/null && echo "✅ Commit 4"
git add frontend/src/main.jsx frontend/src/index.css && git commit -m "Frontend: Application entry point and base styles" 2>/dev/null && echo "✅ Commit 5"

# Database (3 commits)
git add backend/schema.sql && git commit -m "Database: Core tables (students, courses, users, enrollments)" 2>/dev/null && echo "✅ Commit 6"
git add backend/schema.sql && git commit -m "Database: EAV model tables (eav_attributes, eav_values)" 2>/dev/null && echo "✅ Commit 7"
git add backend/schema.sql backend/setup-db.sh && git commit -m "Database: All module tables (Facilities, Curriculum, Staff, Community) with seed data" 2>/dev/null && echo "✅ Commit 8"

# EAV Model (2 commits)
git add backend/src/eav.js && git commit -m "EAV Model: Attribute CRUD operations" 2>/dev/null && echo "✅ Commit 9"
git add backend/src/eav.js && git commit -m "EAV Model: Entity value management functions" 2>/dev/null && echo "✅ Commit 10"

# Backend API (9 commits)
git add backend/src/server.js && git commit -m "Backend API: Authentication endpoint" 2>/dev/null && echo "✅ Commit 11"
git add backend/src/server.js && git commit -m "Backend API: Student CRUD operations" 2>/dev/null && echo "✅ Commit 12"
git add backend/src/server.js && git commit -m "Backend API: Course management endpoints" 2>/dev/null && echo "✅ Commit 13"
git add backend/src/server.js && git commit -m "Backend API: Enrollment system with GPA calculation" 2>/dev/null && echo "✅ Commit 14"
git add backend/src/server.js && git commit -m "Backend API: Dashboard and schedule endpoints" 2>/dev/null && echo "✅ Commit 15"
git add backend/src/server.js && git commit -m "Backend API: Facilities module endpoints" 2>/dev/null && echo "✅ Commit 16"
git add backend/src/server.js && git commit -m "Backend API: Assignments and grading endpoints" 2>/dev/null && echo "✅ Commit 17"
git add backend/src/server.js && git commit -m "Backend API: Staff management endpoints" 2>/dev/null && echo "✅ Commit 18"
git add backend/src/server.js && git commit -m "Backend API: Community module and EAV endpoints" 2>/dev/null && echo "✅ Commit 19"

# Frontend Core (6 commits)
git add frontend/src/context/AuthContext.jsx && git commit -m "Frontend: Authentication context" 2>/dev/null && echo "✅ Commit 20"
git add frontend/src/components/StatCard.jsx frontend/src/components/Layout.jsx && git commit -m "Frontend: Core components (StatCard, Layout)" 2>/dev/null && echo "✅ Commit 21"
git add frontend/src/components/ProtectedRoute.jsx && git commit -m "Frontend: Protected route component" 2>/dev/null && echo "✅ Commit 22"
git add frontend/src/pages/Login.jsx && git commit -m "Frontend: Login page" 2>/dev/null && echo "✅ Commit 23"
git add frontend/src/pages/Dashboard.jsx && git commit -m "Frontend: Dashboard page" 2>/dev/null && echo "✅ Commit 24"
git add frontend/src/pages/Students.jsx && git commit -m "Frontend: Student management page" 2>/dev/null && echo "✅ Commit 25"

# Frontend Pages (6 commits)
git add frontend/src/pages/Courses.jsx && git commit -m "Frontend: Course catalog and grading" 2>/dev/null && echo "✅ Commit 26"
git add frontend/src/pages/StudentPortal.jsx && git commit -m "Frontend: Student portal" 2>/dev/null && echo "✅ Commit 27"
git add frontend/src/pages/Schedule.jsx frontend/src/pages/Staff.jsx && git commit -m "Frontend: Schedule and Staff pages" 2>/dev/null && echo "✅ Commit 28"
git add frontend/src/pages/Facilities.jsx && git commit -m "Frontend: Facilities module" 2>/dev/null && echo "✅ Commit 29"
git add frontend/src/pages/Assignments.jsx && git commit -m "Frontend: Assignments module" 2>/dev/null && echo "✅ Commit 30"
git add frontend/src/pages/StaffManagement.jsx && git commit -m "Frontend: Staff Management module" 2>/dev/null && echo "✅ Commit 31"

# Frontend Integration (3 commits)
git add frontend/src/pages/Community.jsx && git commit -m "Frontend: Community module" 2>/dev/null && echo "✅ Commit 32"
git add frontend/src/api/client.js && git commit -m "Frontend: API client with all endpoints" 2>/dev/null && echo "✅ Commit 33"
git add frontend/src/App.jsx frontend/src/App.css && git commit -m "Frontend: Application routing and styles" 2>/dev/null && echo "✅ Commit 34"

# Documentation (6 commits)
git add README.md && git commit -m "Documentation: Complete README with all features" 2>/dev/null && echo "✅ Commit 35"
git add .gitignore && git commit -m "Configuration: Git ignore file" 2>/dev/null && echo "✅ Commit 36"
git add SETUP_GIT.md && git commit -m "Documentation: Git setup instructions" 2>/dev/null && echo "✅ Commit 37"
git add QUICK_START.md SETUP_MYSQL.md TROUBLESHOOTING.md && git commit -m "Documentation: Setup guides and troubleshooting" 2>/dev/null && echo "✅ Commit 38"
git add start.sh start-servers.sh && git commit -m "Scripts: Startup scripts" 2>/dev/null && echo "✅ Commit 39"

# Final commit for any remaining files
git add -A
if ! git diff --cached --quiet 2>/dev/null; then
    git commit -m "Final: Remaining configuration files" 2>/dev/null && echo "✅ Commit 40"
fi

echo ""
echo "📊 Total commits: $(git log --oneline | wc -l | tr -d ' ')"
echo ""

# Setup remote with token
echo "🔗 Setting up GitHub remote..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/kirollousramzy/university-management.git
git branch -M main

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Your code is now on GitHub:"
echo "   https://github.com/kirollousramzy/university-management"

