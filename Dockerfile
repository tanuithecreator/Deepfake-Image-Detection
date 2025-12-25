FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ /app/backend/
WORKDIR /app/backend

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8080

# Run migrations and start server
CMD flask db upgrade && gunicorn --bind 0.0.0.0:8080 --workers 2 --timeout 300 --worker-class sync app:app

