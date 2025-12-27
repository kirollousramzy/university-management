# Git Repository Setup Instructions

## Step 1: Initialize Git Repository (if not already done)

```bash
cd /Users/kerolosasaad/Desktop/KIROLLOUS
git init
```

## Step 2: Add All Files

```bash
git add .
```

## Step 3: Create Initial Commit

```bash
git commit -m "Complete University Management System

- Implemented Facilities Module (room booking, maintenance, resources)
- Enhanced Curriculum Module (assignments, core/elective courses)
- Enhanced Staff Module (TAs, office hours, performance, research, leave)
- Implemented Community Module (messaging, meetings, events)
- EAV model for flexible data storage
- Complete REST API with 50+ endpoints
- React frontend with all modules integrated"
```

## Step 4: Connect to Your Remote Repository

### Option A: If you have an existing repository URL

```bash
git remote add origin YOUR_REPOSITORY_URL
git branch -M main
git push -u origin main
```

### Option B: If creating a new repository on GitHub/GitLab

1. Create a new repository on GitHub/GitLab (don't initialize with README)
2. Copy the repository URL
3. Run:

```bash
git remote add origin YOUR_REPOSITORY_URL
git branch -M main
git push -u origin main
```

## Step 5: If you need to force push (if remote has different history)

```bash
git push -u origin main --force
```

## Repository Structure

```
KIROLLOUS/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── server.js # Main API with all endpoints
│   │   ├── eav.js    # EAV model implementation
│   │   └── db.js     # Database connection
│   └── schema.sql    # Complete database schema
├── frontend/         # React + Vite application
│   ├── src/
│   │   ├── pages/    # All page components
│   │   ├── components/
│   │   └── api/      # API client
└── README.md         # Project documentation
```

## Important Files to Commit

✅ All source code files
✅ package.json files
✅ schema.sql
✅ Configuration files
❌ node_modules/ (ignored)
❌ dist/ (ignored)
❌ .env files (ignored)

