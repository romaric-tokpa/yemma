"""
Configuration Celery pour les tâches asynchrones
"""
from celery import Celery
from app.core.config import settings

# Construire l'URL Redis
redis_url = f"redis://"
if settings.REDIS_PASSWORD:
    redis_url = f"redis://:{settings.REDIS_PASSWORD}@"
redis_url += f"{settings.REDIS_HOST}:{settings.REDIS_PORT}/0"

# Configuration Celery
celery_app = Celery(
    "notification_service",
    broker=redis_url,
    backend=redis_url,
    include=["app.infrastructure.celery_tasks"]
)

# Configuration Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# Queues
celery_app.conf.task_routes = {
    "app.infrastructure.celery_tasks.send_notification_task": {"queue": "notifications"},
}

