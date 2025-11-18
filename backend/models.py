from datetime import datetime

from .extensions import db, bcrypt


class User(db.Model):
    """User model for authentication and tracking."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    last_login_at = db.Column(db.DateTime, index=True)
    last_login_ip = db.Column(db.String(45))
    failed_login_attempts = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='active', nullable=True)  # 'active', 'suspended', 'banned'

    # Relationships
    media_files = db.relationship(
        "MediaFile",
        back_populates="owner",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    analysis_results = db.relationship(
        "AnalysisResult",
        back_populates="user",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    system_logs = db.relationship(
        "SystemLog",
        back_populates="user",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def set_password(self, password: str) -> None:
        """Hash and set the password."""
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password: str) -> bool:
        """Check if the provided password matches the hash."""
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        """Convert user to dictionary for JSON responses."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_admin": self.is_admin,
            "status": self.status or 'active',  # Default to 'active' if None
            "created_at": self.created_at.isoformat(),
            "last_login_at": self.last_login_at.isoformat()
            if self.last_login_at
            else None,
        }


class MediaFile(db.Model):
    """Uploaded media asset tracked in storage."""

    __tablename__ = "media_files"
    __table_args__ = (
        db.Index("ix_media_files_user_created", "user_id", "uploaded_at"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False, unique=True)
    storage_path = db.Column(db.String(512), nullable=False)
    file_type = db.Column(db.String(50), nullable=False, index=True)
    file_size = db.Column(db.BigInteger, nullable=True)
    checksum = db.Column(db.String(128), nullable=True, index=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_analyzed_at = db.Column(db.DateTime, index=True)

    owner = db.relationship("User", back_populates="media_files")
    analysis_results = db.relationship(
        "AnalysisResult",
        back_populates="media_file",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "original_filename": self.original_filename,
            "stored_filename": self.stored_filename,
            "storage_path": self.storage_path,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "uploaded_at": self.uploaded_at.isoformat(),
            "last_analyzed_at": self.last_analyzed_at.isoformat()
            if self.last_analyzed_at
            else None,
        }


class DetectionModel(db.Model):
    """Metadata for deployed deepfake detection models."""

    __tablename__ = "detection_models"
    __table_args__ = (
        db.UniqueConstraint("name", "version", name="uq_detection_model_name_version"),
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    version = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    accuracy = db.Column(db.Float, nullable=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    weights_path = db.Column(db.String(512), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    analysis_results = db.relationship(
        "AnalysisResult",
        back_populates="model",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "accuracy": self.accuracy,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
            if self.updated_at
            else None,
        }


class AnalysisResult(db.Model):
    """Deepfake analysis results associated with media files."""

    __tablename__ = "analysis_results"
    __table_args__ = (
        db.Index("ix_analysis_results_media_created", "media_file_id", "created_at"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    media_file_id = db.Column(
        db.Integer,
        db.ForeignKey("media_files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    model_id = db.Column(
        db.Integer,
        db.ForeignKey("detection_models.id", ondelete="SET NULL"),
        index=True,
    )
    prediction_label = db.Column(db.String(50), nullable=False, index=True)
    confidence_score = db.Column(db.Float, nullable=False)
    processing_time_ms = db.Column(db.Integer, nullable=True)
    analysis_metadata = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="analysis_results")
    media_file = db.relationship("MediaFile", back_populates="analysis_results")
    model = db.relationship("DetectionModel", back_populates="analysis_results")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "media_file_id": self.media_file_id,
            "model_id": self.model_id,
            "prediction_label": self.prediction_label,
            "confidence_score": round(self.confidence_score, 4),
            "processing_time_ms": self.processing_time_ms,
            "metadata": self.analysis_metadata or {},
            "created_at": self.created_at.isoformat(),
        }


class SystemLog(db.Model):
    """Auditable user activity within the platform."""

    __tablename__ = "system_logs"
    __table_args__ = (
        db.Index("ix_system_logs_action_created", "action_type", "created_at"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    action_type = db.Column(db.String(120), nullable=False)
    status_code = db.Column(db.Integer, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    details = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="system_logs")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "action_type": self.action_type,
            "status_code": self.status_code,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "details": self.details or {},
            "created_at": self.created_at.isoformat(),
        }