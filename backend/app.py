import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from .extensions import db, migrate, bcrypt, jwt

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

def create_app(config_name='development'):
    """Application factory function."""
    app = Flask(__name__)
    
    # ---- Configuration ----
    database_uri = os.getenv(
        'DATABASE_URI',
        'postgresql+psycopg://postgres:password@localhost:5432/deepfake_db'
    )
    
    # Add SQLite-specific configuration if using SQLite
    # Note: SQLite connection args are handled via SQLALCHEMY_ENGINE_OPTIONS below
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,  # Verify connections before using
        'pool_recycle': 300,  # Recycle connections after 5 minutes
    }
    
    # Additional SQLite-specific engine options
    if 'sqlite' in database_uri.lower():
        app.config['SQLALCHEMY_ENGINE_OPTIONS'].update({
            'connect_args': {
                'check_same_thread': False,
                'timeout': 20,  # 20 second timeout for database operations
            },
            'poolclass': None,  # Disable connection pooling for SQLite (single connection)
        })
    
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    app.config['CORS_ORIGINS'] = os.getenv('CORS_ORIGINS', '*').split(',')
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    
    # ---- Initialize Extensions ----
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    
    # Add teardown handler to close database connections properly
    @app.teardown_appcontext
    def close_db(error):
        """Close database connection at the end of request."""
        db.session.remove()
    
    # Add JWT error handlers for better error messages
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired. Please log in again.'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': f'Invalid token: {str(error)}'}), 422
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token is missing'}), 401
    
    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token is not fresh. Please log in again.'}), 401
    
    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type"],
            "supports_credentials": False
        }
    })
    
    # ---- Register Blueprints ----
    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app

if __name__ == '__main__':
    app = create_app()
    # Run on 127.0.0.1:5000 for development
    app.run(debug=True, host='127.0.0.1', port=5000)