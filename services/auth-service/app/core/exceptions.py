"""
Gestion globale des exceptions
"""
from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError

from app.domain.exceptions import (
    AuthError,
    UserNotFoundError,
    UserAlreadyExistsError,
    InvalidCredentialsError,
    TokenError,
    PermissionDeniedError,
)
from app.core.config import settings


def add_cors_headers(response: JSONResponse, request: Request) -> JSONResponse:
    """Ajoute les headers CORS à une réponse"""
    origin = request.headers.get("origin")
    if origin:
        # Vérifier si l'origine est dans la liste des origines autorisées
        # ou si c'est localhost (pour le développement)
        is_allowed = (
            origin in settings.CORS_ORIGINS or
            origin.startswith("http://localhost") or
            origin.startswith("http://127.0.0.1")
        )
        if is_allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"
    return response


class APIException(Exception):
    """Exception de base pour l'API"""
    def __init__(
        self,
        status_code: int,
        message: str,
        details: Dict[str, Any] = None
    ):
        self.status_code = status_code
        self.message = message
        self.details = details or {}


async def api_exception_handler(request: Request, exc: APIException):
    """Handler pour les exceptions API personnalisées"""
    response = JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "details": exc.details,
            "path": str(request.url),
        }
    )
    return add_cors_headers(response, request)


async def auth_error_handler(request: Request, exc: AuthError):
    """Handler pour les erreurs d'authentification"""
    response = JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": True,
            "message": exc.message,
            "details": {"error_type": "authentication_error"},
            "path": str(request.url),
        }
    )
    return add_cors_headers(response, request)


async def invalid_credentials_handler(request: Request, exc: InvalidCredentialsError):
    """Handler pour les identifiants invalides"""
    response = JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": True,
            "message": "Invalid credentials",
            "details": {"error_type": "invalid_credentials"},
            "path": str(request.url),
        }
    )
    return add_cors_headers(response, request)


async def user_not_found_handler(request: Request, exc: UserNotFoundError):
    """Handler pour utilisateur non trouvé"""
    response = JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": True,
            "message": "User not found",
            "details": {"error_type": "user_not_found", "user_id": str(exc.user_id)},
            "path": str(request.url),
        }
    )
    return add_cors_headers(response, request)


async def user_already_exists_handler(request: Request, exc: UserAlreadyExistsError):
    """Handler pour utilisateur déjà existant"""
    response = JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "error": True,
            "message": "User already exists",
            "details": {"error_type": "user_already_exists", "email": exc.email},
            "path": str(request.url),
        }
    )
    return add_cors_headers(response, request)


async def token_error_handler(request: Request, exc: TokenError):
    """Handler pour les erreurs de token"""
    response = JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": True,
            "message": "Token error",
            "details": {"error_type": "token_error", "reason": exc.message},
            "path": str(request.url),
        }
    )
    return add_cors_headers(response, request)


async def permission_denied_handler(request: Request, exc: PermissionDeniedError):
    """Handler pour permission refusée"""
    response = JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={
            "error": True,
            "message": "Permission denied",
            "details": {"error_type": "permission_denied", "required_role": exc.required_role},
            "path": str(request.url),
        }
    )
    return add_cors_headers(response, request)


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handler pour les exceptions HTTP standard"""
    response = JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "details": {},
            "path": str(request.url),
        }
    )
    return add_cors_headers(response, request)


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler pour les erreurs de validation Pydantic"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    
    response = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": "Validation error",
            "details": {"validation_errors": errors},
            "path": str(request.url),
        }
    )
    return add_cors_headers(response, request)


async def general_exception_handler(request: Request, exc: Exception):
    """Handler pour les exceptions non gérées"""
    import traceback
    import logging
    
    logger = logging.getLogger(__name__)
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # En mode DEBUG, inclure le détail de l'erreur pour faciliter le diagnostic
    details = {}
    if settings.DEBUG:
        details["error_type"] = type(exc).__name__
        details["error_message"] = str(exc)
    
    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "message": "Internal server error",
            "details": details,
            "path": str(request.url),
        }
    )
    return add_cors_headers(response, request)


def setup_exception_handlers(app: FastAPI):
    """Configure tous les handlers d'exceptions"""
    # Exceptions personnalisées du domaine
    app.add_exception_handler(AuthError, auth_error_handler)
    app.add_exception_handler(InvalidCredentialsError, invalid_credentials_handler)
    app.add_exception_handler(UserNotFoundError, user_not_found_handler)
    app.add_exception_handler(UserAlreadyExistsError, user_already_exists_handler)
    app.add_exception_handler(TokenError, token_error_handler)
    app.add_exception_handler(PermissionDeniedError, permission_denied_handler)
    
    # Exceptions FastAPI/Starlette
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    # Exception générale (doit être en dernier)
    app.add_exception_handler(Exception, general_exception_handler)

