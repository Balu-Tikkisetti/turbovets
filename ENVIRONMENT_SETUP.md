# Environment Configuration Setup

This document explains how to set up environment variables for the TurboVets application.

## Environment Variables

### For API (Backend)

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=turbovets

# API Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:4200

# Application Configuration
APP_NAME=TurboVets
APP_VERSION=1.0.0
```

### For Dashboard (Frontend)

The Angular frontend uses build-time environment files. Update these files directly:

- `apps/dashboard/src/environments/environment.ts` - Default development environment
- `apps/dashboard/src/environments/environment.local.ts` - Local development environment  
- `apps/dashboard/src/environments/environment.prod.ts` - Production environment

## Environment Files

### Dashboard Environment Files

The Angular environment files are compiled at build time, not runtime. Update them directly:

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api'
};
```

### API Configuration

- `apps/api/src/config/database.config.ts` - Centralized configuration for database, server, and JWT settings

## Usage

### For Development:
1. Update the environment files in `apps/dashboard/src/environments/` with your local API URL
2. Create a `.env` file in the root directory for API configuration
3. Update the values according to your setup

### For Production:
1. Update `environment.prod.ts` with your production API URL
2. Set environment variables on your production server for the API
3. Build the application with the production environment

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique JWT secrets in production
- Update database credentials for production environments
- Use HTTPS URLs for production API endpoints
- The frontend environment files are public, so don't put sensitive data there
