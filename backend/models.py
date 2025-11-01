from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import datetime

# Initialize SQLAlchemy and Bcrypt objects
db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    detections = db.relationship('DetectionLog', backref='user', lazy=True)

class DetectionLog(db.Model):
    __tablename__ = 'detection_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    file_hash = db.Column(db.String(64), nullable=True) 
    final_prediction = db.Column(db.String(4), nullable=False)
    confidence_score = db.Column(db.Float, nullable=False)
    xai_generated = db.Column(db.Boolean, default=False)
    # NEW COLUMN for multi-model tracking:
    model_used = db.Column(db.String(50), nullable=False, default='XCEPTION_FF++')