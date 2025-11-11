
import os
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from io import BytesIO
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db, bcrypt
from models import User, Upload

api_bp = Blueprint('api', __name__)

# ---- ML Model Configuration ----
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'combined_resnet18_best.pth')
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Load model at startup
model = None
try:
    model = models.resnet18(pretrained=False)
    model.fc = torch.nn.Linear(512, 2)  # Binary classification: REAL (0) or FAKE (1)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    print(f"✓ Model loaded successfully: {MODEL_PATH}")
except Exception as e:
    print(f"✗ Failed to load model: {e}")

# Image preprocessing pipeline
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def run_inference(image_bytes: bytes) -> tuple:
    """
    Run PyTorch model inference on image bytes.
    Returns: (prediction_result: str, confidence_score: float)
    """
    if model is None:
        raise Exception("Model not loaded")
    
    try:
        # Load and preprocess image
        image = Image.open(BytesIO(image_bytes)).convert('RGB')
        image_tensor = transform(image).unsqueeze(0).to(DEVICE)
        
        # Run inference
        with torch.no_grad():
            output = model(image_tensor)
            probabilities = torch.nn.functional.softmax(output, dim=1)
            confidence, prediction = torch.max(probabilities, 1)
        
        # Map prediction: 0 = REAL, 1 = FAKE
        result = "FAKE" if prediction.item() == 1 else "REAL"
        confidence_score = confidence.item()
        
        return result, confidence_score
    except Exception as e:
        raise Exception(f"Inference failed: {str(e)}")

# ============================================================================
# Authentication Endpoints
# ============================================================================

@api_bp.route('/register', methods=['POST'])
def register():
    """Register a new user account."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Validate required fields
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields: username, email, password'}), 400
    
    # Check username uniqueness
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    # Check email uniqueness
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    try:
        user = User(username=data['username'], email=data['email'])
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@api_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token."""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

# ============================================================================
# Protected User Endpoints
# ============================================================================

@api_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    """Get current authenticated user's information."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

# ============================================================================
# Core ML Prediction Endpoint
# ============================================================================

@api_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict():
    """
    Upload image and run deepfake detection.
    - Requires JWT authentication
    - Accepts image file upload (max 16MB)
    - Runs PyTorch model inference
    - Saves results to database
    - Returns prediction results
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Validate file presence
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Validate file type
    if not allowed_file(file.filename):
        allowed = ', '.join(ALLOWED_EXTENSIONS)
        return jsonify({'error': f'Invalid file type. Allowed: {allowed}'}), 400
    
    try:
        # Read image bytes
        image_bytes = file.read()
        
        # Run ML inference
        prediction_result, confidence_score = run_inference(image_bytes)
        
        # Save prediction to database
        filename = secure_filename(file.filename)
        upload = Upload(
            user_id=user_id,
            image_filename=filename,
            prediction_result=prediction_result,
            confidence_score=confidence_score
        )
        db.session.add(upload)
        db.session.commit()
        
        return jsonify({
            'message': 'Prediction completed successfully',
            'prediction': upload.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

# ============================================================================
# History Endpoint - Paginated User Predictions
# ============================================================================

@api_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """Get paginated history of predictions for current user."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get pagination parameters from query string
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Ensure valid pagination values
    page = max(1, page)
    per_page = min(100, max(1, per_page))
    
    # Query uploads ordered by most recent first
    uploads_pagination = Upload.query.filter_by(user_id=user_id).order_by(
        Upload.upload_timestamp.desc()
    ).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'total': uploads_pagination.total,
        'pages': uploads_pagination.pages,
        'current_page': page,
        'per_page': per_page,
        'uploads': [u.to_dict() for u in uploads_pagination.items]
    }), 200

# ============================================================================
# Health Check Endpoint
# ============================================================================

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify API and model status."""
    try:
        db.session.execute('SELECT 1')
        db_status = 'connected'
    except Exception as e:
        db_status = f'error: {str(e)}'
    
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'device': str(DEVICE),
        'database': db_status
    }), 200