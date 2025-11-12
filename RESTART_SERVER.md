# Fix 404 Errors - Restart Flask Server

## Problem
The admin endpoints (`/api/admin/users`, `/api/admin/stats`, `/api/admin/analytics`) are returning 404 errors because the Flask server was started **before** these routes were added to the code.

## Solution
**You need to restart your Flask server** to load the new routes.

### Steps:

1. **Stop the current Flask server:**
   - In your terminal where Flask is running, press `Ctrl+C` to stop it

2. **Restart the Flask server:**
   ```bash
   cd backend
   flask --app app:create_app run
   ```

3. **Verify the routes are loaded:**
   - The server should start without errors
   - Try accessing the admin dashboard again
   - The 404 errors should be gone

## Why This Happens
Flask loads all routes when the application starts. Since the admin routes were added after the server was already running, they weren't registered. Restarting the server will:
- Re-import all Python modules
- Register all routes including the new admin endpoints
- Make them available at `/api/admin/*`

## Quick Check
After restarting, you should see successful requests like:
- `GET /api/admin/stats HTTP/1.1" 200`
- `GET /api/admin/users HTTP/1.1" 200`
- `GET /api/admin/analytics HTTP/1.1" 200`

Instead of:
- `GET /api/admin/stats HTTP/1.1" 404`

