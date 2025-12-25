"""
Test script to verify all backend modules are working correctly.
Run this script to diagnose issues with admin login and other modules.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import create_app
from backend.extensions import db
from backend.models import User
from backend.routes import model as ml_model
import traceback

def test_database_connection():
    """Test database connection and basic queries."""
    print("\n" + "="*60)
    print("TEST 1: Database Connection")
    print("="*60)
    try:
        app = create_app()
        with app.app_context():
            # Test connection
            db.session.execute(db.text("SELECT 1"))
            print("[OK] Database connection successful")
            
            # Check if users table exists
            result = db.session.execute(db.text("SELECT name FROM sqlite_master WHERE type='table' AND name='users'"))
            if result.fetchone():
                print("[OK] Users table exists")
            else:
                print("[ERROR] Users table does not exist")
                return False
            
            # Count users
            user_count = User.query.count()
            print(f"[OK] Found {user_count} users in database")
            
            return True
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        traceback.print_exc()
        return False

def test_admin_user():
    """Check if admin user exists and can be queried."""
    print("\n" + "="*60)
    print("TEST 2: Admin User Check")
    print("="*60)
    try:
        app = create_app()
        with app.app_context():
            # Find admin users
            admin_users = User.query.filter_by(is_admin=True).all()
            print(f"[OK] Found {len(admin_users)} admin user(s)")
            
            if admin_users:
                for admin in admin_users:
                    print(f"   - Username: {admin.username}, Email: {admin.email}")
                    print(f"     Has password: {bool(admin.password_hash)}")
                    print(f"     Status: {admin.status or 'active'}")
                    print(f"     Failed login attempts: {admin.failed_login_attempts or 0}")
            else:
                print("[WARNING] No admin users found. You may need to create one.")
                print("   Use POST /api/admin/create-admin endpoint")
            
            # Find all users
            all_users = User.query.all()
            print(f"\n[OK] Total users in database: {len(all_users)}")
            for user in all_users:
                print(f"   - {user.username} ({user.email}) - Admin: {user.is_admin}")
            
            return True
    except Exception as e:
        print(f"[ERROR] Admin user check failed: {e}")
        traceback.print_exc()
        return False

def test_password_hashing():
    """Test password hashing and verification."""
    print("\n" + "="*60)
    print("TEST 3: Password Hashing")
    print("="*60)
    try:
        from backend.extensions import bcrypt
        
        test_password = "test_password_123"
        password_hash = bcrypt.generate_password_hash(test_password).decode("utf-8")
        print(f"[OK] Password hash generated: {password_hash[:50]}...")
        
        # Test verification
        is_valid = bcrypt.check_password_hash(password_hash, test_password)
        if is_valid:
            print("[OK] Password verification successful")
        else:
            print("[ERROR] Password verification failed")
            return False
        
        # Test wrong password
        is_invalid = bcrypt.check_password_hash(password_hash, "wrong_password")
        if not is_invalid:
            print("[OK] Wrong password correctly rejected")
        else:
            print("[ERROR] Wrong password incorrectly accepted")
            return False
        
        return True
    except Exception as e:
        print(f"[ERROR] Password hashing test failed: {e}")
        traceback.print_exc()
        return False

def test_model_loading():
    """Test if ML model loads correctly."""
    print("\n" + "="*60)
    print("TEST 4: ML Model Loading")
    print("="*60)
    try:
        if ml_model is None:
            print("[ERROR] Model is None - not loaded")
            return False
        
        print("[OK] Model object exists")
        print(f"   Model type: {type(ml_model)}")
        
        # Test model inference with dummy input
        import torch
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        test_input = torch.randn(1, 3, 224, 224).to(device)
        
        ml_model.eval()
        with torch.no_grad():
            output = ml_model(test_input)
            print(f"[OK] Model inference successful")
            print(f"   Output shape: {output.shape}")
            print(f"   Output values: {output.cpu().numpy()[0]}")
            
            # Check if output is reasonable (not all zeros or NaNs)
            if torch.isnan(output).any():
                print("[ERROR] Model output contains NaN values")
                return False
            if (output == 0).all():
                print("[WARNING] Model output is all zeros (may indicate untrained model)")
            else:
                print("[OK] Model output looks reasonable")
        
        return True
    except Exception as e:
        print(f"[ERROR] Model loading test failed: {e}")
        traceback.print_exc()
        return False

def test_login_simulation():
    """Simulate login process for admin user."""
    print("\n" + "="*60)
    print("TEST 5: Login Simulation")
    print("="*60)
    try:
        app = create_app()
        with app.app_context():
            # Find admin user
            admin = User.query.filter_by(is_admin=True).first()
            if not admin:
                print("[WARNING] No admin user found - skipping login test")
                return True
            
            print(f"Testing login for: {admin.username}")
            
            # Test password check
            test_passwords = ["admin", "password", "admin123", "Admin123"]
            print("\nTesting common passwords:")
            for pwd in test_passwords:
                is_valid = admin.check_password(pwd)
                status = "[OK]" if is_valid else "[FAIL]"
                print(f"   {status} Password '{pwd}': {'VALID' if is_valid else 'INVALID'}")
            
            # Check if password hash exists
            if not admin.password_hash:
                print("[ERROR] Admin user has no password hash set!")
                return False
            
            print(f"\n[OK] Admin user has password hash: {bool(admin.password_hash)}")
            print(f"   Status: {admin.status or 'active'}")
            print(f"   Failed login attempts: {admin.failed_login_attempts or 0}")
            
            return True
    except Exception as e:
        print(f"[ERROR] Login simulation failed: {e}")
        traceback.print_exc()
        return False

def create_test_admin():
    """Create a test admin user if none exists."""
    print("\n" + "="*60)
    print("TEST 6: Create Test Admin (if needed)")
    print("="*60)
    try:
        app = create_app()
        with app.app_context():
            admin = User.query.filter_by(is_admin=True).first()
            if admin:
                print(f"[OK] Admin user already exists: {admin.username}")
                return True
            
            # Create test admin
            test_admin = User(
                username="admin",
                email="admin@test.com",
                is_admin=True
            )
            test_admin.set_password("admin123")
            db.session.add(test_admin)
            db.session.commit()
            
            print("[OK] Test admin user created:")
            print(f"   Username: admin")
            print(f"   Email: admin@test.com")
            print(f"   Password: admin123")
            print("\n[WARNING] IMPORTANT: Change this password in production!")
            
            return True
    except Exception as e:
        print(f"[ERROR] Failed to create test admin: {e}")
        traceback.print_exc()
        return False

def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("BACKEND MODULE DIAGNOSTICS")
    print("="*60)
    
    results = []
    
    # Run tests
    results.append(("Database Connection", test_database_connection()))
    results.append(("Password Hashing", test_password_hashing()))
    results.append(("Admin User Check", test_admin_user()))
    results.append(("ML Model Loading", test_model_loading()))
    results.append(("Login Simulation", test_login_simulation()))
    
    # Optionally create test admin
    create_test_admin()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for test_name, passed in results:
        status = "[PASSED]" if passed else "[FAILED]"
        print(f"{status}: {test_name}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n[OK] All modules are working correctly!")
    else:
        print("\n[WARNING] Some modules have issues. Review the errors above.")

if __name__ == "__main__":
    main()
