FROM python:3.11-slim

WORKDIR /app

# opencv-python-headless still needs libglib/libgomp, but not the X11/GL stack
# that the non-headless wheel pulls in.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/
RUN mkdir -p /app/backend/uploads

# Single-threaded BLAS/OMP: the free instance is a fraction of a CPU and every
# extra thread carries its own allocator arena against a 512MB ceiling.
# MALLOC_ARENA_MAX caps those arenas, which otherwise default to 8*ncores and
# inflate RSS well beyond live data.
ENV MALLOC_ARENA_MAX=2
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV TORCH_NUM_THREADS=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

# ONE worker, deliberately. Each gunicorn worker loads its own torch and model
# (~420MB measured at boot); a second worker guarantees an OOM kill at 512MB.
# Two threads keep the liveness probe answerable while a long video analysis
# runs -- inference itself is serialised by a lock in routes.py.
CMD ["sh", "-c", "python -m flask --app backend.app:create_app db upgrade --directory backend/migrations && exec gunicorn 'backend.app:create_app()' --bind 0.0.0.0:${PORT:-8080} --workers 1 --threads 2 --timeout 300 --graceful-timeout 30 --access-logfile - --error-logfile -"]
