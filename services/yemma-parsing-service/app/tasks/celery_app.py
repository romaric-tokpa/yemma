"""
Configuration Celery pour les tâches asynchrones de parsing CV
"""
import logging
from celery import Celery
from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# Configuration Celery
celery_app = Celery(
    "yemma-parsing",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.parse_cv"]
)

# Configuration des tâches
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max
    task_soft_time_limit=240,  # 4 minutes soft limit
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# Routes pour les tâches
celery_app.conf.task_routes = {
    "app.tasks.parse_cv.*": {"queue": "parsing"},
}
