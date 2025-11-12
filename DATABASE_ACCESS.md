# How to Access SQLite Database

## Database Location

Your SQLite database is located at:
```
instance/deepfake_dev.db
```

## Method 1: Using the Python Viewer Script (Recommended)

Run the database viewer script:

```bash
cd backend
python view_database.py
```

This will display:
- All users
- All media files
- All analysis results
- Detection models
- System logs
- Summary statistics

## Method 2: Using SQLite Browser (GUI Tool)

1. **Download DB Browser for SQLite** (free):
   - https://sqlitebrowser.org/
   - Or use any SQLite GUI tool

2. **Open the database**:
   - Open DB Browser
   - Click "Open Database"
   - Navigate to: `instance/deepfake_dev.db`
   - Click Open

3. **Browse tables**:
   - Click "Browse Data" tab
   - Select a table from the dropdown (users, media_files, analysis_results, etc.)
   - View and edit data

## Method 3: Using Command Line (sqlite3)

```bash
# Windows PowerShell
cd instance
sqlite3 deepfake_dev.db

# Then run SQL commands:
.tables                    # List all tables
SELECT * FROM users;        # View all users
SELECT * FROM media_files;  # View all media files
SELECT * FROM analysis_results;  # View all analysis results
.quit                      # Exit
```

## Method 4: Using Python REPL

```bash
cd backend
python

# Then in Python:
from app import create_app
from extensions import db
from models import User, MediaFile, AnalysisResult

app = create_app()
with app.app_context():
    users = User.query.all()
    for u in users:
        print(f"{u.id}: {u.username} ({u.email})")
```

## Quick Database Queries

### View all users:
```sql
SELECT id, username, email, is_admin, created_at FROM users;
```

### View all uploads:
```sql
SELECT mf.id, mf.original_filename, mf.file_type, mf.file_size, 
       u.username, mf.uploaded_at 
FROM media_files mf 
JOIN users u ON mf.user_id = u.id 
ORDER BY mf.uploaded_at DESC;
```

### View all analysis results:
```sql
SELECT ar.id, ar.prediction_label, ar.confidence_score, 
       mf.original_filename, u.username, ar.created_at 
FROM analysis_results ar 
JOIN media_files mf ON ar.media_file_id = mf.id 
JOIN users u ON ar.user_id = u.id 
ORDER BY ar.created_at DESC;
```

### Count statistics:
```sql
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM media_files) as total_files,
  (SELECT COUNT(*) FROM analysis_results) as total_analyses,
  (SELECT COUNT(*) FROM analysis_results WHERE prediction_label = 'FAKE') as deepfakes_detected;
```

