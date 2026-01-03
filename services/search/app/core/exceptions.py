"""
Gestion globale des exceptions
"""
from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


class SearchError(Exception):
    """Exception de base pour les erreurs de recherche"""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class IndexingError(SearchError):
    """Erreur lors de l'indexation"""
    def __init__(self, message: str = "Indexing error"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)


class ElasticsearchError(SearchError):
    """Erreur ElasticSearch"""
    def __init__(self, message: str = "Elasticsearch error"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)


async def search_error_handler(request: Request, exc: SearchError):
    """Handler pour les erreurs de recherche"""
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
    app.add_exception_handler(SearchError, search_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

