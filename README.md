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

## Features

- **Task Management**: Create, edit, assign, and track tasks
- **User Roles**: Owner, Admin, Viewer with different permissions  
- **JWT Authentication**: Secure login with token-based auth
- **Audit Logging**: Track all user actions and changes
- **Responsive UI**: Works on desktop and mobile
- **Real-time Updates**: Live task updates across users

## Future Improvements

- Multi-factor authentication
- File attachments for tasks
- Real-time notifications
- Mobile app
- Advanced analytics
- Integration with external tools

---

**Built with NX • NestJS • Angular • TypeScript • PostgreSQL** 
