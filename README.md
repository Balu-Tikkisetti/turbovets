# TurboVets - Task Management System

A task management app built with NX monorepo, featuring role-based access control and JWT authentication.

**Built with:** NX • NestJS • Angular • TypeScript • PostgreSQL

## Project Structure

```
turbovets/
├── apps/
│   ├── api/                    # Backend (NestJS)
│   └── dashboard/              # Frontend (Angular)
├── libs/                       # Shared libraries
└── dist/                      # Build output
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

### Setup

1. **Clone and install:**
```bash
git clone https://github.com/Balu-Tikkisetti/turbovets.git
cd turbovets
npm install
```

2. **Database setup:**
```bash
# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Create database and user
psql -U postgres
CREATE USER your_username WITH PASSWORD 'your_password';
CREATE DATABASE turbovets OWNER your_username;
GRANT ALL PRIVILEGES ON DATABASE turbovets TO your_username;
\q
```

3. **Environment setup:**
Create `.env` file:
```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/turbovets
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
API_PORT=3000
NG_APP_API_URL=http://localhost:3000
```

4. **Run the apps:**
```bash
# Terminal 1 - Backend
npx nx serve api

# Terminal 2 - Frontend  
npx nx serve dashboard
```

**Access:**
- Frontend: http://localhost:4200
- Backend: http://localhost:3000

## Available Commands

```bash
# Development
npx nx serve api        # Start backend
npx nx serve dashboard  # Start frontend

# Building
npx nx build api        # Build backend
npx nx build dashboard  # Build frontend

# Testing
npx nx test api         # Test backend
npx nx test dashboard   # Test frontend
```

## User Roles

**Owner**: Can do everything - manage users, delete any task, view all logs
**Admin**: Can edit all tasks, assign tasks, view department logs (can't delete tasks)
**Viewer**: Can edit only their own personal tasks, view all tasks (can't delete or assign)

## Main Data Models

**User**: id, username, email, password, role (owner/admin/viewer), department
**Task**: id, title, description, priority, status, category, dueDate, assigneeId, creatorId
**AuditLog**: id, userId, action, resource, timestamp (tracks all user actions)

## API Endpoints

### Authentication
- `POST /auth/login` - Login with username/password
- `POST /auth/register` - Create new user account

### Tasks
- `GET /tasks` - Get all tasks (requires auth)
- `POST /tasks` - Create new task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task (owner only)

### Users
- `GET /users` - Get all users (owner/admin only)
- `PATCH /users/:id/role` - Update user role (owner only)

### Audit Logs
- `GET /audit-log` - Get activity logs (owner/admin only)

**All endpoints require JWT token in Authorization header:**
```
Authorization: Bearer <your-jwt-token>
```

## Setup Instructions

### Backend Setup
```bash
# Install dependencies
npm install

# Start API server
npx nx serve api
```

### Frontend Setup  
```bash
# Install dependencies (if not done)
npm install

# Start dashboard
npx nx serve dashboard
```

## Architecture Overview

**Monorepo Structure:**
- `apps/api/` - NestJS backend with TypeORM
- `apps/dashboard/` - Angular frontend with NgRx
- `libs/` - Shared libraries for types and utilities
- Single codebase, shared dependencies, unified testing

**Key Modules:**
- Authentication (JWT + refresh tokens)
- Task Management (CRUD operations)
- User Management (role-based access)
- Audit Logging (activity tracking)

## Access Control Design

**Role Hierarchy:**
- **Owner**: Full system access, can delete any task, manage users
- **Admin**: Can edit all tasks, assign tasks, view department logs
- **Viewer**: Can edit only personal tasks, view all tasks

**Data Models:**
- **User**: id, username, email, password, role, department
- **Task**: id, title, description, priority, status, category, dueDate, assigneeId, creatorId
- **AuditLog**: id, userId, action, resource, timestamp

## Sample API Requests/Responses

### Login
```bash
POST /auth/login
{
  "username": "user@example.com", 
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "username": "john.doe",
    "role": "admin"
  }
}
```

### Create Task
```bash
POST /tasks
Authorization: Bearer <token>
{
  "title": "Fix bug in login",
  "description": "User cannot login with special characters",
  "priority": "high",
  "status": "to-do",
  "category": "work"
}

Response:
{
  "id": "task-456",
  "title": "Fix bug in login",
  "status": "to-do",
  "priority": "high",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Get All Tasks
```bash
GET /tasks
Authorization: Bearer <token>

Response:
{
  "tasks": [
    {
      "id": "task-456",
      "title": "Fix bug in login", 
      "status": "in-progress",
      "assignee": {
        "username": "john.doe"
      }
    }
  ]
}
```

## Security & Scalability Improvements

**Security:**
- Add rate limiting per user/IP
- Implement 2FA for admin accounts
- Add input validation and sanitization
- Use HTTPS in production
- Add session timeout handling

**Scalability:**
- Add Redis for caching
- Implement database connection pooling
- Add load balancing for multiple API instances
- Use CDN for static assets
- Add database indexing for better query performance
- Implement microservices for large scale

**Performance:**
- Add pagination for large task lists
- Implement lazy loading for components
- Add database query optimization
- Use compression for API responses

---

**Built with NX • NestJS • Angular • TypeScript • PostgreSQL** 
