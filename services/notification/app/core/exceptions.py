"""
Gestion globale des exceptions
"""
from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


class NotificationError(Exception):
    """Exception de base pour les erreurs de notification"""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class EmailError(NotificationError):
    """Erreur lors de l'envoi d'email"""
    def __init__(self, message: str = "Failed to send email"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)


class TemplateNotFoundError(NotificationError):
    """Template d'email non trouvé"""
    def __init__(self, template_name: str):
        super().__init__(f"Email template '{template_name}' not found", status.HTTP_404_NOT_FOUND)


async def notification_error_handler(request: Request, exc: NotificationError):
    """Handler pour les erreurs de notification"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "path": str(request.url),
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handler pour les exceptions HTTP standard"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "path": str(request.url),
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler pour les erreurs de validation Pydantic"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": "Validation error",
            "details": {"validation_errors": errors},
            "path": str(request.url),
        }
    )


def setup_exception_handlers(app: FastAPI):
    """Configure tous les handlers d'exceptions"""
    app.add_exception_handler(NotificationError, notification_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)


