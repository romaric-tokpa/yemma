FROM python:3.11-slim

# Build argument for environment
ARG APP_ENV=development

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    APP_ENV=${APP_ENV}

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY auth-service/requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy shared module for internal authentication (depuis le contexte ./services)
COPY shared /app/shared

# Copy application code
COPY auth-service /app

# Create alembic versions directory
RUN mkdir -p alembic/versions

# Expose port
EXPOSE 8000

# Health check with longer start period for production
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application - production mode without reload, with multiple workers
CMD if [ "$APP_ENV" = "production" ]; then \
        uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2; \
    else \
        uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload; \
    fi

