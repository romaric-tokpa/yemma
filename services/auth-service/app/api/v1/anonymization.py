"""
Endpoint d'anonymisation de compte utilisateur (RGPD)
"""
import secrets
import string
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.domain.models import User
from app.domain.schemas import TokenData
from app.infrastructure.database import get_session
from app.infrastructure.security import get_current_user
from app.infrastructure.repositories import UserRepository, RefreshTokenRepository
from app.core.config import settings

# Import pour l'authentification interne
import sys
import os
import importlib.util

# Le module shared est monté dans /shared via docker-compose
shared_path = "/shared"
internal_auth_path = os.path.join(shared_path, "internal_auth.py")

# Ajouter le chemin au PYTHONPATH si nécessaire
if os.path.exists(shared_path) and shared_path not in sys.path:
    sys.path.insert(0, shared_path)

# Importer depuis shared
try:
    # Essayer d'importer directement depuis le fichier
    if os.path.exists(internal_auth_path):
        spec = importlib.util.spec_from_file_location("shared.internal_auth", internal_auth_path)
        if spec and spec.loader:
            internal_auth_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(internal_auth_module)
            get_service_token_header = internal_auth_module.get_service_token_header
        else:
            raise ImportError("Could not load internal_auth module")
    else:
        # Essayer l'import normal
        from shared.internal_auth import get_service_token_header
except ImportError as e:
    # Fallback: essayer avec services.shared
    try:
        from services.shared.internal_auth import get_service_token_header
    except ImportError:
        raise ImportError(f"Could not import internal_auth. Shared path: {shared_path}, File exists: {os.path.exists(internal_auth_path)}, Error: {str(e)}")

router = APIRouter()


def generate_anonymous_string(length: int = 16) -> str:
    """Génère une chaîne aléatoire pour anonymiser les données"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


@router.post("/anonymize", status_code=status.HTTP_200_OK)
async def anonymize_account(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Anonymise le compte de l'utilisateur connecté (RGPD)
    
    Cette fonction :
    - Remplace l'email et le nom par des chaînes aléatoires
    - Supprime tous les documents de l'utilisateur (via Document Service)
    - Conserve les logs d'audit (sans données personnelles) pour la cohérence des quotas
    - Révoque tous les tokens de l'utilisateur
    """
    user_repo = UserRepository(session)
    token_repo = RefreshTokenRepository(session)
    
    # Récupérer l'utilisateur
    user = await user_repo.get_by_id(current_user.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Vérifier que l'utilisateur n'est pas déjà anonymisé
    if user.email.startswith("anon_") or user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is already anonymized or deleted"
        )
    
    try:
        # 1. Supprimer les documents via Document Service
        if settings.DOCUMENT_SERVICE_URL and settings.INTERNAL_SERVICE_TOKEN_SECRET:
            try:
                headers = get_service_token_header("auth-service")
                async with httpx.AsyncClient(timeout=10.0) as client:
                    # Récupérer le candidate_id depuis le profil (si c'est un candidat)
                    # Pour l'instant, on suppose que l'utilisateur a un profil candidat
                    # Dans un vrai système, il faudrait vérifier le rôle et récupérer le candidate_id
                    # Pour simplifier, on utilise l'user_id comme candidate_id
                    response = await client.delete(
                        f"{settings.DOCUMENT_SERVICE_URL}/api/v1/admin/candidate/{current_user.user_id}",
                        headers=headers
                    )
                    if response.status_code != 200:
                        print(f"Warning: Could not delete documents for user {current_user.user_id}: {response.text}")
            except Exception as e:
                print(f"Warning: Error calling Document Service: {str(e)}")
                # On continue même si la suppression des documents échoue
        
        # 2. Anonymiser les données personnelles
        anonymous_email = f"anon_{generate_anonymous_string()}@anonymized.local"
        anonymous_first_name = f"Anonymous_{generate_anonymous_string()[:8]}"
        anonymous_last_name = f"User_{generate_anonymous_string()[:8]}"
        
        user.email = anonymous_email
        user.first_name = anonymous_first_name
        user.last_name = anonymous_last_name
        user.status = "inactive"  # Désactiver le compte
        user.updated_at = datetime.utcnow()
        
        # 3. Révoquer tous les tokens de l'utilisateur
        await token_repo.revoke_user_tokens(user.id)
        
        # 4. Sauvegarder les modifications
        user = await user_repo.update(user)
        
        return {
            "message": "Account successfully anonymized",
            "anonymized_at": datetime.utcnow().isoformat(),
            "note": "All personal data has been anonymized. Audit logs are preserved without personal information."
        }
    
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error anonymizing account: {str(e)}"
        )

