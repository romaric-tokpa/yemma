"""
Script pour lancer le worker Celery
"""
from app.infrastructure.celery_app import celery_app

# Exporter celery_app pour la commande celery
__all__ = ["celery_app"]

