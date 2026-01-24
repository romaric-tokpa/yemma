"""
Dépendance FastAPI pour vérifier les tokens de service interne
"""
from fastapi import Depends, HTTPException, status, Header
from typing import Optional
import sys
import os
import importlib.util

# Le module shared est monté dans /shared via docker-compose
shared_path = "/shared"
internal_auth_path = os.path.join(shared_path, "internal_auth.py")

# Importer depuis shared en utilisant importlib pour éviter les problèmes de module
import importlib.util

if os.path.exists(internal_auth_path):
    spec = importlib.util.spec_from_file_location("shared.internal_auth", internal_auth_path)
    if spec and spec.loader:
        internal_auth_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(internal_auth_module)
        verify_service_token = internal_auth_module.verify_service_token
    else:
        # Fallback: essayer depuis services/shared (chemin relatif)
        shared_module_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "shared")
        if os.path.exists(shared_module_path) and shared_module_path not in sys.path:
            sys.path.insert(0, shared_module_path)
        try:
            from services.shared.internal_auth import verify_service_token
        except ImportError:
            raise RuntimeError(f"Failed to load verify_service_token from {internal_auth_path}. Make sure the shared volume is mounted.")
else:
    # Le fichier n'existe pas, essayer d'importer depuis services/shared
    shared_module_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "shared")
    if os.path.exists(shared_module_path) and shared_module_path not in sys.path:
        sys.path.insert(0, shared_module_path)
    try:
        from services.shared.internal_auth import verify_service_token
    except ImportError:
        # Dernier fallback: définir une fonction dummy qui lèvera une erreur explicite
        def verify_service_token(token: str):
            raise RuntimeError(f"Shared module not found at {internal_auth_path}. Make sure ./services/shared:/shared is mounted in docker-compose.yml.")
        print(f"⚠️ Warning: Shared module not found at {internal_auth_path}. Using dummy function.")


async def verify_internal_token(
    x_service_token: Optional[str] = Header(None, alias="X-Service-Token"),
    x_service_name: Optional[str] = Header(None, alias="X-Service-Name"),
) -> dict:
    """
    Dépendance FastAPI pour vérifier que la requête provient d'un autre microservice
    
    Usage:
        @router.post("/internal/endpoint")
        async def internal_endpoint(
            service_info: dict = Depends(verify_internal_token)
        ):
            service_name = service_info["service"]
            ...
    
    Args:
        x_service_token: Token JWT dans le header X-Service-Token
        x_service_name: Nom du service dans le header X-Service-Name
    
    Returns:
        dict: Informations du service (service, type, exp, iat)
    
    Raises:
        HTTPException: Si le token est manquant ou invalide
    """
    if not x_service_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Service-Token header",
            headers={"WWW-Authenticate": "Service"},
        )
    
    # Vérifier le token
    payload = verify_service_token(x_service_token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired service token",
            headers={"WWW-Authenticate": "Service"},
        )
    
    # Vérifier que c'est bien un token de service interne
    if payload.get("type") != "internal_service":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Expected internal_service token.",
            headers={"WWW-Authenticate": "Service"},
        )
    
    return payload
