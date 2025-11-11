from datetime import datetime
from app import db, bcrypt

class User(db.Model):
    """User model for authentication and tracking."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    uploads = db.relationship('Upload', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password: str):
        """Hash and set the password."""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password: str) -> bool:
        """Check if the provided password matches the hash."""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary for JSON responses."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat()
        }


class Upload(db.Model):
    """Upload/Detection model for storing prediction results."""
    __tablename__ = 'uploads'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    image_filename = db.Column(db.String(255), nullable=False)
    prediction_result = db.Column(db.String(10), nullable=False)  # "REAL" or "FAKE"
    confidence_score = db.Column(db.Float, nullable=False)
    upload_timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convert upload to dictionary for JSON responses."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'image_filename': self.image_filename,
            'prediction_result': self.prediction_result,
            'confidence_score': round(self.confidence_score, 4),
            'upload_timestamp': self.upload_timestamp.isoformat()
        }