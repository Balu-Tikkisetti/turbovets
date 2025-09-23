
# TurboVets - Secure Task Management System

A comprehensive, secure task management system built with **NX monorepo**, featuring **Role-Based Access Control (RBAC)**, **JWT authentication**, and **organization-wide task visibility**.  

**Tech Stack:** NX • NestJS • Angular • TypeScript • PostgreSQL (with SQLite fallback)

---

## Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL 15+ (default is SQLite for quick start)

---

## Database Setup (PostgreSQL)

### Install PostgreSQL
- **Mac (Homebrew)**:
  ```bash
  brew install postgresql@15
  brew services start postgresql@15
  ```
- **Ubuntu/Debian**:
  ```bash
  sudo apt update
  sudo apt install postgresql-15 postgresql-client-15
  sudo service postgresql start
  ```
- **Windows**: [Download PostgreSQL 15 installer](https://www.postgresql.org/download/windows/)

### Create Database and User
Login as postgres superuser:
```bash
psql -U postgres
```

Run these SQL commands:
```sql
CREATE USER balu WITH PASSWORD 'balu';
CREATE DATABASE turbovets OWNER balu;
GRANT ALL PRIVILEGES ON DATABASE turbovets TO balu;
```

---

## Project Installation & Setup

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd turbovets
npm install
```

### 2. Environment Configuration
Create `.env` file in the root directory:
```env
# Database (SQLite default)
DATABASE_URL=sqlite:./data/database.sqlite

# PostgreSQL (Uncomment for production or local use)
# DATABASE_URL=postgresql://balu:balu@localhost:5432/turbovets

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m

# API Configuration
API_PORT=3000
API_HOST=localhost

# Frontend Configuration
NG_APP_API_URL=http://localhost:3000
```

### 3. Run Development Servers
```bash
# Start both API and Dashboard concurrently
npm run dev

# Start API only
npm run start:api

# Start Dashboard only
npm run start:dashboard
```

---

## Available Scripts
```bash
npm run dev              # Start both API and Dashboard
npm run start:api        # Start API server only
npm run start:dashboard  # Start Dashboard only
npm run build            # Build all applications
npm run lint             # Lint all code
npm test                 # Run all tests
npm run test:api         # Run API tests
npm run test:dashboard   # Run Dashboard tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Run tests with coverage
npm run build:production # Build for production
```

---

## Access Control (RBAC)

### Role Hierarchy
```
Owner (Highest)
├── Can access everything
├── Can delete any task
├── Can move tasks between departments
└── Can view all audit logs

Admin
├── Can edit all tasks
├── Cannot delete tasks (except own)
├── Can view department audit logs
└── Can manage department tasks

Viewer
├── Can edit personal tasks they created
├── Can view all tasks (organization-wide)
├── Cannot delete tasks (except own personal)
└── Limited audit log access
```

---

## JWT Authentication Flow
1. **Login**: User provides credentials  
2. **Token Generation**: JWT access token (15min) + refresh token (7 days)  
3. **Request Authorization**: Bearer token in Authorization header  
4. **Token Validation**: JWT strategy validates and extracts user info  
5. **Role Checking**: Guards verify permissions for each endpoint  

---

## API Documentation

### Authentication Endpoints
#### POST `/auth/login`
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

#### POST `/auth/register`
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123"
}
```

### Task Management Endpoints
#### GET `/tasks`
**Headers:** `Authorization: Bearer <token>`

#### POST `/tasks`
```json
{
  "title": "New Task",
  "description": "Task description",
  "priority": "medium",
  "status": "to-do",
  "category": "work",
  "department": "Engineering"
}
```

#### PUT `/tasks/:id`
#### DELETE `/tasks/:id`
#### POST `/tasks/bulk/delete`
#### POST `/tasks/bulk-update-status`

### Audit Log Endpoints
#### GET `/audit-log`
**Headers:** `Authorization: Bearer <token>` (Owner/Admin only)

---

## Frontend Features

### Task Management Dashboard
- **Organization-wide Task View**: All authenticated users can see all tasks  
- **Real-time Updates**: Automatic task refresh every minute  
- **Advanced Filtering**: By status, priority, category, department  
- **Bulk Operations**: Bulk delete and status updates  
- **Responsive Design**: Mobile-first approach with Tailwind CSS  

### Authentication UI
- **Login/Register Forms**: Clean, accessible forms  
- **JWT Token Management**: Automatic token refresh  
- **Route Protection**: Authenticated routes only  

### State Management (NgRx)
- **Actions**: Task CRUD, filtering, sorting  
- **Reducers**: State management for tasks and auth  
- **Effects**: API communication and side effects  
- **Selectors**: Efficient data selection  

---

## Production Deployment

### Environment Variables
```env
# Production Database (PostgreSQL)
DATABASE_URL=postgresql://balu:balu@prod-db:5432/turbovets

# Secure JWT Secret
JWT_SECRET=your-production-secret-key-here

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
```

### Build and Run
```bash
npm run build:production
```

---

## Future Considerations

### Advanced Features
- **Role Delegation**: Temporary role assignment  
- **Advanced Permissions**: Granular permission system  
- **Multi-tenancy**: Support for multiple organizations  
- **Real-time Collaboration**: WebSocket-based live updates  

### Security Enhancements
- **JWT Refresh Tokens**: Secure token renewal  
- **CSRF Protection**: Cross-site request forgery prevention  
- **Rate Limiting**: API request throttling  
- **RBAC Caching**: Redis-based permission caching  

---

**Built with:** NX • NestJS • Angular • TypeScript • PostgreSQL
