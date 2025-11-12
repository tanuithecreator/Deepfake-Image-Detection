# Admin User Setup & Login Troubleshooting

## Quick Fix for Login Issues

If you can't login with an existing user, you can reset their password using one of these methods:

### Method 1: Using the API Endpoint (Easiest)

```bash
# Reset password for a user
curl -X POST http://127.0.0.1:5000/api/admin/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "newpassword123"}'

# Or by email
curl -X POST http://127.0.0.1:5000/api/admin/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "newpassword123"}'
```

### Method 2: Using Python Script

```bash
cd backend
python create_admin.py admin admin@deepdetect.com admin123
```

This will:
- Create a new admin user if it doesn't exist
- Update an existing user to admin and reset their password

### Method 3: Check User Info (Debug)

```bash
# Check if user exists and get their info
curl -X POST http://127.0.0.1:5000/api/debug/user-info \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username"}'
```

## Create Admin User

### Option 1: Using the Script (Recommended)

```bash
cd backend
python create_admin.py admin admin@deepdetect.com admin123
```

### Option 2: Using the API

```bash
curl -X POST http://127.0.0.1:5000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@deepdetect.com",
    "password": "admin123"
  }'
```

## Default Admin Credentials

After running the setup, you can use:
- **Username:** `admin`
- **Email:** `admin@deepdetect.com`
- **Password:** `admin123` (or whatever you set)

## Troubleshooting Login Issues

1. **User exists but can't login:**
   - Use the reset-password endpoint to reset their password
   - Make sure you're using the correct username OR email (case-insensitive for email)

2. **"Invalid username or password" error:**
   - Check if user exists: Use `/api/debug/user-info`
   - Reset password: Use `/api/admin/reset-password`
   - Try logging in with email instead of username (or vice versa)

3. **Password not working:**
   - The password might not have been hashed correctly during initial signup
   - Use the reset-password endpoint to set a new password

## Notes

- Passwords must be at least 6 characters long
- Email matching is case-insensitive
- Username matching is case-sensitive
- The reset-password endpoint is open for development - secure it in production!

