"""
Dépendance FastAPI pour vérifier les tokens de service interne
"""
from fastapi import Depends, HTTPException, status, Header
from typing import Optional
import sys
import os
import importlib.util

# En Docker : /shared est monté. En local : services/shared (relatif à ce fichier)
# Ce fichier est dans services/candidate/app/infrastructure/ -> 3 niveaux = services/
_this_dir = os.path.dirname(os.path.abspath(__file__))
_services_dir = os.path.abspath(os.path.join(_this_dir, "..", "..", ".."))
_shared_dir_local = os.path.join(_services_dir, "shared")
# En Docker : /shared. En local : services/shared (doit exister)
shared_path = "/shared" if os.path.exists("/shared") else _shared_dir_local
_path_to_add = os.path.dirname(shared_path) if os.path.exists(shared_path) else _services_dir
if _path_to_add and _path_to_add not in sys.path:
    sys.path.insert(0, _path_to_add)

# Charger internal_auth depuis le fichier si possible (évite "import shared" quand le chemin est bon)
internal_auth_path = os.path.join(shared_path, "internal_auth.py") if os.path.exists(shared_path) else os.path.join(_services_dir, "shared", "internal_auth.py")
if os.path.exists(internal_auth_path):
    spec = importlib.util.spec_from_file_location("shared.internal_auth", internal_auth_path)
    if spec and spec.loader:
        internal_auth_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(internal_auth_module)
        verify_service_token = internal_auth_module.verify_service_token
    else:
        from shared.internal_auth import verify_service_token
else:
    from shared.internal_auth import verify_service_token


async def verify_internal_token(
    x_service_token: Optional[str] = Header(None, alias="X-Service-Token"),
    x_service_name: Optional[str] = Header(None, alias="X-Service-Name"),
) -> Optional[dict]:
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
    import logging
    logger = logging.getLogger(__name__)
    
    # Si pas de token de service, retourner None (l'endpoint utilisera l'auth utilisateur)
    if not x_service_token:
        logger.debug("No X-Service-Token header found, returning None")
        return None
    
    logger.info(f"Received X-Service-Token header (length: {len(x_service_token)}), X-Service-Name: {x_service_name}")
    
    # Vérifier le token
    try:
        payload = verify_service_token(x_service_token)
        
        if not payload:
            logger.warning(f"Token verification failed for service: {x_service_name}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired service token",
                headers={"WWW-Authenticate": "Service"},
            )
        
        logger.info(f"Token verified successfully for service: {payload.get('service')}")
        
        # Optionnel: vérifier que le nom du service correspond
        if x_service_name and payload.get("service") != x_service_name:
            logger.warning(f"Service name mismatch: expected {x_service_name}, got {payload.get('service')}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Service name mismatch",
                headers={"WWW-Authenticate": "Service"},
            )
        
        return payload
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying service token: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Error verifying service token: {str(e)}",
            headers={"WWW-Authenticate": "Service"},
        )

