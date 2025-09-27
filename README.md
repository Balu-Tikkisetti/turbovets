# TurboVets - Secure Task Management System

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

A comprehensive, secure task management system built with **NX monorepo**, featuring **Role-Based Access Control (RBAC)**, **JWT authentication**, and **organization-wide task visibility**.

**Tech Stack:** NX • NestJS • Angular • TypeScript • PostgreSQL (with SQLite fallback)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL 15+ (optional - SQLite used by default)

### 1. Clone and Install
```bash
git clone https://github.com/Balu-Tikkisetti/turbovets.git
cd turbovets
npm install
```

### 2. Environment Setup
Create `.env` file in the root directory:
```env
# Database (SQLite default - works out of the box)
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

# OR start them separately in different terminals:
npx nx serve api        # Backend API (port 3000)
npx nx serve dashboard  # Frontend Dashboard (port 4200)
```

**Access the application:**
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000

---

## 🗄️ Database Setup (PostgreSQL)

### Install PostgreSQL

**Mac (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-client-15
sudo service postgresql start
```

**Windows:**
[Download PostgreSQL 15 installer](https://www.postgresql.org/download/windows/)

### Create Database and User

**Login as postgres superuser:**
```bash
psql -U postgres
```

**Run these SQL commands:**
```sql
-- Create user with password
CREATE USER balu WITH PASSWORD 'balu';

-- Create database and assign ownership
CREATE DATABASE turbovets OWNER balu;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE turbovets TO balu;

-- Exit psql
\q
```

**Update your `.env` file:**
```env
DATABASE_URL=postgresql://balu:balu@localhost:5432/turbovets
```

---

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start both API and Dashboard
npm run start:api        # Start API server only
npm run start:dashboard  # Start Dashboard only

# Building
npm run build            # Build all applications
npm run build:production # Build for production

# Testing
npm test                 # Run all tests
npm run test:api         # Run API tests
npm run test:dashboard   # Run Dashboard tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Lint all code

# NX Commands
npx nx graph             # Visualize project dependencies
npx nx show project dashboard  # Show project details
```

---

## 🔐 Access Control (RBAC)

### Role Hierarchy
```
Owner (Highest Authority)
├── Full system access
├── Can delete any task
├── Can manage all users
├── Can view all audit logs
└── Can move tasks between departments

Admin (Management Level)
├── Can edit all tasks
├── Cannot delete tasks (except own)
├── Can view department audit logs
└── Can manage department tasks

Viewer (Basic Access)
├── Can edit personal tasks they created
├── Can view all tasks (organization-wide)
├── Cannot delete tasks (except own personal)
└── Limited audit log access
```

### User Management
- **Owners** can edit member roles through the Members section
- **Admins** can view but not modify user roles
- **Viewers** have read-only access to member information

---

## 🔑 JWT Authentication Flow

1. **Login**: User provides credentials via `/auth/login`
2. **Token Generation**: 
   - Access token (15 minutes)
   - Refresh token (7 days)
3. **Request Authorization**: Bearer token in `Authorization` header
4. **Token Validation**: JWT strategy validates and extracts user info
5. **Role Checking**: Guards verify permissions for each endpoint
6. **Automatic Refresh**: Frontend handles token renewal seamlessly

---

## 🛠️ API Documentation

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
#### DELETE `/tasks/:id` (Owner/Admin only)
#### PATCH `/tasks/:id/assign` (Owner/Admin only)
#### POST `/tasks/bulk/delete`
#### POST `/tasks/bulk-update-status`

### Audit Log Endpoints
#### GET `/audit-log`
**Headers:** `Authorization: Bearer <token>` (Owner/Admin only)

---

## 🎨 Frontend Features

### Task Management Dashboard
- **Organization-wide Task View**: All authenticated users can see all tasks
- **Real-time Updates**: Automatic task refresh and live updates
- **Advanced Filtering**: By status, priority, category, department
- **Bulk Operations**: Bulk delete and status updates
- **Task Overlay**: In-place editing with role-based permissions
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Authentication UI
- **Secure Login/Register**: Clean, accessible forms
- **JWT Token Management**: Automatic token refresh and storage
- **Route Protection**: Authenticated routes with role-based access
- **Session Management**: Automatic logout on inactivity

### State Management (NgRx)
- **Actions**: Task CRUD, filtering, sorting, user management
- **Reducers**: Centralized state management
- **Effects**: API communication and side effects
- **Selectors**: Efficient data selection and caching

---

## 🔒 Security Features

### Backend Security
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Granular permission system
- **Rate Limiting**: API request throttling (100 req/15min)
- **Input Validation**: Comprehensive data validation
- **Security Headers**: CSRF, XSS, and clickjacking protection
- **Audit Logging**: Complete activity tracking

### Frontend Security
- **CSRF Protection**: X-Requested-With headers
- **Secure Storage**: Minimal session data in sessionStorage
- **Session Timeout**: Automatic logout after 30 minutes inactivity
- **Content Security Policy**: XSS protection
- **Route Guards**: Protected routes with role checking

---

## 🚀 Production Deployment

### Environment Variables
```env
# Production Database
DATABASE_URL=postgresql://username:password@prod-db:5432/turbovets

# Secure JWT Secret (generate a strong secret)
JWT_SECRET=your-production-secret-key-here

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# API Configuration
API_PORT=3000
NODE_ENV=production
```

### Build and Deploy
```bash
# Build for production
npm run build:production

# The built files will be in dist/ folder
# Deploy dist/apps/api/ and dist/apps/dashboard/ to your servers
```

---

## 🔧 Development

### Adding New Features
```bash
# Generate new Angular component
npx nx g @nx/angular:component feature-name

# Generate new NestJS controller
npx nx g @nx/nest:controller feature-name

# Generate new library
npx nx g @nx/angular:lib shared-library
```

### Code Quality
- **ESLint**: Configured for both Angular and NestJS
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Testing**: Jest for unit tests, Cypress for E2E

---

## 📚 Learn More

### NX Workspace
- [NX Documentation](https://nx.dev)
- [Angular + NestJS Tutorial](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial)
- [NX Console](https://nx.dev/getting-started/editor-setup) - IDE extension

### Technology Stack
- **Frontend**: Angular 17+, NgRx, Tailwind CSS
- **Backend**: NestJS, TypeORM, PostgreSQL
- **Monorepo**: NX workspace management
- **Authentication**: JWT with refresh tokens
- **Database**: PostgreSQL with SQLite fallback

### Community
- [NX Discord](https://go.nx.dev/community)
- [Angular Discord](https://discord.gg/angular)
- [NestJS Discord](https://discord.gg/nestjs)

---

**Built with ❤️ using NX • NestJS • Angular • TypeScript • PostgreSQL** 
