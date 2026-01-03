"""
Middleware/Décorateur pour la consultation sécurisée des profils candidats

Flux :
1. Vérifier le quota (POST /quotas/check)
2. Si OK, afficher le profil
3. Enregistrer l'accès (Audit Service)
4. Décrémenter le quota (POST /quotas/use)
"""
import httpx
from typing import Callable, Optional
from functools import wraps
from fastapi import HTTPException, status, Request, Depends
import sys
import os

# Ajouter le chemin du module shared au PYTHONPATH
shared_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "shared")
if shared_path not in sys.path:
    sys.path.insert(0, shared_path)

from services.shared.internal_auth import get_service_token_header
from app.core.config import settings


async def check_quota(company_id: int, quota_type: str = "profile_views") -> dict:
    """
    Vérifie si l'entreprise a encore des quota disponibles
    
    Args:
        company_id: ID de l'entreprise
        quota_type: Type de quota (défaut: profile_views)
    
    Returns:
        Dict avec allowed, used, limit, remaining, message
    
    Raises:
        HTTPException si le quota est dépassé ou erreur de service
    """
    try:
        # Générer les headers avec le token de service
        headers = get_service_token_header("search-service")
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{settings.PAYMENT_SERVICE_URL}/api/v1/quotas/check",
                json={
                    "company_id": company_id,
                    "quota_type": quota_type
                },
                headers=headers
            )
            
            if response.status_code == 200:
                quota_data = response.json()
                if not quota_data.get("allowed", False):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=quota_data.get("message", "Quota exceeded")
                    )
                return quota_data
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Subscription not found"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error checking quota: {response.text}"
                )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service timeout"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Payment service unavailable: {str(e)}"
        )


async def use_quota(company_id: int, quota_type: str = "profile_views", amount: int = 1) -> dict:
    """
    Décrémente le quota d'une entreprise
    
    Args:
        company_id: ID de l'entreprise
        quota_type: Type de quota (défaut: profile_views)
        amount: Quantité à consommer (défaut: 1)
    
    Returns:
        Dict avec message, used, limit, remaining
    
    Raises:
        HTTPException en cas d'erreur
    """
    try:
        # Générer les headers avec le token de service
        headers = get_service_token_header("search-service")
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{settings.PAYMENT_SERVICE_URL}/api/v1/quotas/use",
                json={
                    "company_id": company_id,
                    "quota_type": quota_type,
                    "amount": amount
                },
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Quota exceeded"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error using quota: {response.text}"
                )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service timeout"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Payment service unavailable: {str(e)}"
        )


async def log_access(
    recruiter_id: int,
    recruiter_email: str,
    recruiter_name: Optional[str],
    company_id: int,
    company_name: Optional[str],
    candidate_id: int,
    candidate_email: Optional[str],
    candidate_name: Optional[str],
    access_type: str = "profile_view",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> dict:
    """
    Enregistre un accès dans le service Audit
    
    Args:
        recruiter_id: ID du recruteur
        recruiter_email: Email du recruteur
        recruiter_name: Nom du recruteur
        company_id: ID de l'entreprise
        company_name: Nom de l'entreprise
        candidate_id: ID du candidat
        candidate_email: Email du candidat
        candidate_name: Nom du candidat
        access_type: Type d'accès (défaut: profile_view)
        ip_address: Adresse IP
        user_agent: User Agent
    
    Returns:
        Dict avec les données du log créé
    
    Raises:
        HTTPException en cas d'erreur
    """
    try:
        # Générer les headers avec le token de service
        headers = get_service_token_header("search-service")
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{settings.AUDIT_SERVICE_URL}/api/v1/audit",
                json={
                    "recruiter_id": recruiter_id,
                    "recruiter_email": recruiter_email,
                    "recruiter_name": recruiter_name,
                    "company_id": company_id,
                    "company_name": company_name,
                    "candidate_id": candidate_id,
                    "candidate_email": candidate_email,
                    "candidate_name": candidate_name,
                    "access_type": access_type,
                    "ip_address": ip_address,
                    "user_agent": user_agent
                },
                headers=headers
            )
            
            if response.status_code == 201:
                return response.json()
            else:
                # Ne pas bloquer si l'audit échoue, juste logger
                print(f"Warning: Failed to log access: {response.text}")
                return {}
    except Exception as e:
        # Ne pas bloquer si l'audit échoue, juste logger
        print(f"Warning: Failed to log access: {str(e)}")
        return {}


async def require_quota_and_log_dependency(
    request: Request,
    candidate_id: int,
    current_user = None,  # Sera injecté par Depends
    quota_type: str = "profile_views",
    access_type: str = "profile_view"
):
    """
    Dépendance FastAPI pour vérifier le quota et logger l'accès
    
    Cette fonction est appelée avant l'exécution de l'endpoint.
    Elle vérifie le quota, et après l'exécution, elle log l'accès et décrémente le quota.
    
    Note: Cette approche nécessite d'être appelée manuellement dans l'endpoint.
    """
    # Cette fonction sera utilisée différemment - voir l'endpoint pour l'implémentation
    pass


def require_quota_and_log(
    quota_type: str = "profile_views",
    access_type: str = "profile_view"
):
    """
    Décorateur pour protéger un endpoint avec vérification de quota et logging
    
    Usage:
        @router.get("/candidates/{candidate_id}")
        @require_quota_and_log()
        async def get_candidate(
            candidate_id: int,
            request: Request,
            current_user: TokenData = Depends(get_current_user)
        ):
            ...
    
    Le décorateur :
    1. Vérifie le quota via Payment Service
    2. Exécute la fonction
    3. Enregistre l'accès via Audit Service
    4. Décrémente le quota via Payment Service
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(
            *args,
            request: Request = None,
            current_user: Optional[object] = None,
            **kwargs
        ):
            # Extraire company_id depuis current_user
            company_id = None
            if hasattr(current_user, 'company_id') and current_user.company_id:
                company_id = current_user.company_id
            elif 'company_id' in kwargs:
                company_id = kwargs['company_id']
            else:
                # Si pas de company_id dans le token, essayer de récupérer depuis Company Service
                # via le user_id (pour les recruteurs)
                if hasattr(current_user, 'user_id'):
                    try:
                        async with httpx.AsyncClient(timeout=5.0) as client:
                            # Récupérer l'entreprise du recruteur
                            response = await client.get(
                                f"{settings.COMPANY_SERVICE_URL}/api/v1/recruiters/me",
                                headers={"Authorization": request.headers.get("Authorization", "")}
                            )
                            if response.status_code == 200:
                                recruiter_data = response.json()
                                company_id = recruiter_data.get("company_id")
                    except Exception:
                        pass
                
                if not company_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="company_id is required. User must be associated with a company."
                    )
            
            # Extraire candidate_id depuis kwargs ou args
            candidate_id = None
            if 'candidate_id' in kwargs:
                candidate_id = kwargs['candidate_id']
            elif len(args) > 0:
                candidate_id = args[0]
            
            if not candidate_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="candidate_id is required"
                )
            
            # 1. Vérifier le quota
            quota_data = await check_quota(company_id, quota_type)
            
            # 2. Exécuter la fonction (afficher le profil)
            try:
                result = await func(*args, request=request, current_user=current_user, **kwargs)
            except Exception as e:
                # Si erreur, ne pas décrémenter le quota
                raise
            
            # 3. Enregistrer l'accès (non-bloquant)
            # Récupérer les informations du candidat depuis le résultat
            candidate_email = None
            candidate_name = None
            if isinstance(result, dict):
                candidate_email = result.get("email")
                first_name = result.get("first_name", "")
                last_name = result.get("last_name", "")
                candidate_name = f"{first_name} {last_name}".strip() if first_name or last_name else None
            
            # Récupérer le nom de l'entreprise si possible
            company_name = None
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    response = await client.get(
                        f"{settings.COMPANY_SERVICE_URL}/api/v1/companies/{company_id}",
                        headers={"Authorization": request.headers.get("Authorization", "")}
                    )
                    if response.status_code == 200:
                        company_data = response.json()
                        company_name = company_data.get("name")
            except Exception:
                pass  # Non-bloquant
            
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
            
            await log_access(
                recruiter_id=current_user.user_id,
                recruiter_email=getattr(current_user, 'email', ''),
                recruiter_name=None,  # Peut être récupéré depuis Auth Service si nécessaire
                company_id=company_id,
                company_name=company_name,
                candidate_id=candidate_id,
                candidate_email=candidate_email,
                candidate_name=candidate_name,
                access_type=access_type,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # 4. Décrémenter le quota
            await use_quota(company_id, quota_type, amount=1)
            
            return result
        
        return wrapper
    return decorator

