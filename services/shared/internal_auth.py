"""
Module partagé pour l'authentification inter-services
Génère et vérifie les tokens JWT pour les appels entre microservices
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
import os


# Secret partagé pour signer les tokens de service
# Doit être identique dans tous les services
INTERNAL_SERVICE_TOKEN_SECRET = os.getenv(
    "INTERNAL_SERVICE_TOKEN_SECRET",
    "yemma-internal-service-secret-key-change-in-production-min-64-chars-12345678901234567890123456789012"
)

# Algorithme de signature
INTERNAL_SERVICE_TOKEN_ALGORITHM = "HS256"

# Durée de vie du token (24 heures)
INTERNAL_SERVICE_TOKEN_EXPIRE_HOURS = 24


def generate_service_token(service_name: str) -> str:
    """
    Génère un token JWT pour les appels inter-services
    
    Args:
        service_name: Nom du service qui génère le token (ex: "admin-service", "candidate-service")
    
    Returns:
        str: Token JWT signé
    """
    expire = datetime.utcnow() + timedelta(hours=INTERNAL_SERVICE_TOKEN_EXPIRE_HOURS)
    
    payload = {
        "service": service_name,
        "type": "internal_service",
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    
    token = jwt.encode(
        payload,
        INTERNAL_SERVICE_TOKEN_SECRET,
        algorithm=INTERNAL_SERVICE_TOKEN_ALGORITHM
    )
    
    return token


def verify_service_token(token: str) -> Optional[dict]:
    """
    Vérifie et décode un token de service
    
    Args:
        token: Token JWT à vérifier
    
    Returns:
        dict: Payload du token si valide, None sinon
    """
    try:
        payload = jwt.decode(
            token,
            INTERNAL_SERVICE_TOKEN_SECRET,
            algorithms=[INTERNAL_SERVICE_TOKEN_ALGORITHM]
        )
        
        # Vérifier que c'est bien un token de service interne
        if payload.get("type") != "internal_service":
            return None
        
        return payload
    except JWTError:
        return None


def get_service_token_header(service_name: str) -> dict:
    """
    Génère le header avec le token de service pour les appels HTTP
    
    Args:
        service_name: Nom du service qui fait l'appel
    
    Returns:
        dict: Headers avec le token de service
    """
    token = generate_service_token(service_name)
    return {
        "X-Service-Token": token,
        "X-Service-Name": service_name,
    }

