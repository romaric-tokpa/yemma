FROM python:3.11-slim

ARG APP_ENV=development

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_ENV=${APP_ENV}

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD if [ "$APP_ENV" = "production" ]; then \
        uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2; \
    else \
        uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload; \
    fi

