"""
Gestion globale des exceptions
"""
from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.config import settings


class CompanyError(Exception):
    """Exception de base pour les erreurs du service entreprise"""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class CompanyNotFoundError(CompanyError):
    """Entreprise non trouvée"""
    def __init__(self, company_id: str):
        super().__init__(f"Company with id {company_id} not found", status.HTTP_404_NOT_FOUND)


class RecruiterNotFoundError(CompanyError):
    """Recruteur non trouvé"""
    def __init__(self, recruiter_id: str):
        super().__init__(f"Recruiter with id {recruiter_id} not found", status.HTTP_404_NOT_FOUND)


class InvitationError(CompanyError):
    """Erreur d'invitation"""
    def __init__(self, message: str = "Invitation error"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)


class PermissionDeniedError(CompanyError):
    """Permission refusée"""
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


async def company_error_handler(request: Request, exc: CompanyError):
    """Handler pour les erreurs du service entreprise"""
    origin = request.headers.get("origin")
    headers = {}
    
    # Ajouter les en-têtes CORS si l'origine est autorisée
    if origin and origin in settings.cors_origins_list:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "*"
        headers["Access-Control-Allow-Headers"] = "*"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "path": str(request.url),
        },
        headers=headers
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handler pour les exceptions HTTP standard"""
    origin = request.headers.get("origin")
    headers = {}
    
    # Ajouter les en-têtes CORS si l'origine est autorisée
    if origin and origin in settings.cors_origins_list:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "*"
        headers["Access-Control-Allow-Headers"] = "*"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "path": str(request.url),
        },
        headers=headers
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
    
    origin = request.headers.get("origin")
    headers = {}
    
    # Ajouter les en-têtes CORS si l'origine est autorisée
    if origin and origin in settings.cors_origins_list:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "*"
        headers["Access-Control-Allow-Headers"] = "*"
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": "Validation error",
            "details": {"validation_errors": errors},
            "path": str(request.url),
        },
        headers=headers
    )


def setup_exception_handlers(app: FastAPI):
    """Configure tous les handlers d'exceptions"""
    app.add_exception_handler(CompanyError, company_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

