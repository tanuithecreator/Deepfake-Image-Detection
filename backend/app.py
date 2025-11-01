from flask import Flask
from flask_cors import CORS
from .models import db, bcrypt 
from .routes import api_bp 
import os # Import os
from dotenv import load_dotenv # Import dotenv

# Load environment variables from .env file
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # --- CONFIGURATION (Now read from .env) ---
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions with the app
    db.init_app(app)
    bcrypt.init_app(app)
    CORS(app) 
    
    # Register the Blueprint containing all routes
    app.register_blueprint(api_bp)

    # Create tables only if they don't exist
    with app.app_context():
        db.create_all()
        print("Database tables ensured.")
        
    return app

if __name__ == '__main__':
    app = create_app()
    print("Flask server running...")
    app.run(debug=True, port=5000)