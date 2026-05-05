# Database Connection Fix Guide

## Current Issue:
- DNS resolution error: `ENOTFOUND metro.proxy.rlwy.net`
- Database works in test but fails in application
- Intermittent connectivity issues

## Quick Fixes:

### 1. Restart Application
```bash
cd backend
npm start
```

### 2. Check Railway Status
- Go to Railway dashboard
- Verify database is running
- Check for maintenance notices

### 3. Use Local Database (Development)
Update `backend/.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/lingopeer
JWT_SECRET=9f8a7b6c5d4e3f2a1b0c_super_secret_key_2026!
PORT=5000
GEMINI_API_KEY=AIzaSyDi6fyAIw1sJ1fzCTw8H-XzgW3vvwSZGp8
GEMINI_MODEL=gemini-3-flash-preview
```

### 4. Add Connection Retry Logic
The application should handle temporary database failures gracefully.

## Test Commands:
```bash
# Test connection
node test-db-connection.js

# Start server
npm start

# Create tables
npm run create-community-table
```

## If Problem Persists:
1. Railway database might be temporarily down
2. Network connectivity issues
3. DNS resolution problems
4. Consider switching to local PostgreSQL for development

The connection test worked, so database is accessible. The issue might be timing-related or intermittent.
