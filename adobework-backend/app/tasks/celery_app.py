"""
Celery Application Configuration
For background task processing
"""
from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "adobework",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.workers"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max
    worker_prefetch_multiplier=1,
    result_expires=3600,  # Results expire after 1 hour
)
