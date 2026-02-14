"""
Dépendances FastAPI partagées pour l'authentification inter-services
"""
from fastapi import Depends, HTTPException, status, Header
from typing import Optional

from .internal_auth import verify_service_token


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
    
    # Optionnel: vérifier que le nom du service correspond
    if x_service_name and payload.get("service") != x_service_name:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Service name mismatch",
            headers={"WWW-Authenticate": "Service"},
        )
    
    return payload

