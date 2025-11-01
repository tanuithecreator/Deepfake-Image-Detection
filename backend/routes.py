import os
import io
import numpy as np
import tensorflow as tf
from PIL import Image
from flask import request, jsonify, g, Blueprint
from functools import wraps
import hashlib
import matplotlib.pyplot as plt
import seaborn as sns 
import base64

from .models import db, bcrypt, User, DetectionLog

api_bp = Blueprint('api', __name__)

# --- MODEL CONFIGURATION ---
MODEL_CONFIGS = {
    "XCEPTION_FF++": {
        "path": "model/xceptionnet_detector_best.h5",
        "last_conv": "block13_sepconv2_bn",
        "input_size": 299 # Xception input size
    },
    # Future Model Example: You can uncomment and use this once you train a smaller model
    # "MOBILENET_V2": {
    #     "path": "model/mobilenet_v2_new.h5",
    #     "last_conv": "Conv_1_relu",
    #     "input_size": 224
    # }
}

LOADED_MODELS = {}

# --- UTILITIES ---

def load_models():
    """Loads all models defined in MODEL_CONFIGS dynamically."""
    global LOADED_MODELS
    for name, config in MODEL_CONFIGS.items():
        try:
            model = tf.keras.models.load_model(config["path"])
            model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
            LOADED_MODELS[name] = model
            print(f"✅ Model '{name}' loaded successfully.")
        except Exception as e:
            print(f"❌ Error loading model '{name}': {e}")

def get_current_user():
    # ... (Logic remains the same) ...
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(" ")[1]
        user = User.query.filter_by(username=token).first() 
        return user
    return None

def login_required(f):
    # ... (Decorator remains the same) ...
    @wraps(f)
    def decorated_function(*args, **kwargs):
        g.user = get_current_user()
        if g.user is None:
            return jsonify({"message": "Authorization required or token invalid"}), 401
        return f(*args, **kwargs)
    return decorated_function

def preprocess_image(image_file, target_size):
    """Loads, processes, and hashes the image with a dynamic target size."""
    image_file.seek(0)
    img_bytes = image_file.read()
    image_file.seek(0)
    
    file_hash = hashlib.sha256(img_bytes).hexdigest()
    img = Image.open(io.BytesIO(img_bytes))
    img = img.resize((target_size, target_size))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array, file_hash, img

def make_gradcam_heatmap(img_array, model, last_conv_layer_name):
    # ... (Grad-CAM computation logic remains the same) ...
    grad_model = tf.keras.models.Model(
        [model.inputs], 
        [model.get_layer(last_conv_layer_name).output, model.output]
    )

    with tf.GradientTape() as tape:
        last_conv_layer_output, preds = grad_model(img_array)
        pred_index = tf.argmax(preds[0]) 
        class_channel = preds[:, pred_index]

    grads = tape.gradient(class_channel, last_conv_layer_output)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    last_conv_layer_output = last_conv_layer_output[0]
    heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
    return heatmap.numpy()

# --- ROUTES DEFINITION ---

@api_bp.before_app_request
def initialize_models_before_request():
    """Ensure models are loaded before handling any request."""
    if not LOADED_MODELS:
        load_models()
        
# ... (Register and Login routes remain the same) ...
@api_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "User already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, password_hash=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

@api_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()

    if user and bcrypt.check_password_hash(user.password_hash, password):
        token = user.username 
        return jsonify({"message": "Login successful", "token": token}), 200
    
    return jsonify({"message": "Invalid credentials"}), 401


@api_bp.route('/predict', methods=['POST'])
@login_required 
def predict_deepfake():
    # --- MODEL SELECTION (Primary Detector) ---
    MODEL_KEY = "XCEPTION_FF++"
    model = LOADED_MODELS.get(MODEL_KEY)
    config = MODEL_CONFIGS.get(MODEL_KEY)

    if model is None:
        return jsonify({'error': f'Model {MODEL_KEY} not loaded.'}), 500

    if 'file' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['file']
    
    # Preprocess using the selected model's input size
    preprocessed_img, file_hash, original_img_data = preprocess_image(file, config['input_size'])
    
    if preprocessed_img is None:
        return jsonify({'error': 'Image processing failed.'}), 400

    # --- CORE PREDICTION ---
    prediction = model.predict(preprocessed_img)[0][0]
    is_fake_probability = float(prediction)
    result_label = "FAKE" if is_fake_probability > 0.5 else "REAL"

    # --- XAI GENERATION ---
    heatmap_b64 = None
    xai_success = False
    try:
        heatmap = make_gradcam_heatmap(preprocessed_img, model, config['last_conv'])
        
        # Create an overlay image (using PIL and matplotlib)
        plt.figure(figsize=(config['input_size'] / 100, config['input_size'] / 100), dpi=100) 
        plt.imshow(original_img_data)
        sns.heatmap(heatmap, alpha=0.5, cmap='jet', cbar=False, 
                    square=True, xticklabels=False, yticklabels=False, 
                    linewidths=0, linecolor='white')
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
        plt.close()

        heatmap_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        xai_success = True
        
    except Exception as e:
        print(f"XAI Grad-CAM Error: {e}") 
    
    # --- DB LOGGING ---
    log_entry = DetectionLog(
        user_id=g.user.id,
        file_hash=file_hash,
        final_prediction=result_label,
        confidence_score=round(is_fake_probability, 4),
        xai_generated=xai_success,
        model_used=MODEL_KEY # Log the model used
    )
    db.session.add(log_entry)
    db.session.commit()

    # --- Return Response ---
    return jsonify({
        'status': 'success',
        'prediction': result_label,
        'confidence_fake': round(is_fake_probability * 100, 2),
        'confidence_real': round((1 - is_fake_probability) * 100, 2),
        'xai_heatmap_base64': heatmap_b64 
    })