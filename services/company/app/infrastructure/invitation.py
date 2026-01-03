"""
Gestion des invitations avec génération de tokens
"""
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional

from app.core.config import settings
from app.domain.models import Invitation, InvitationStatus


def generate_invitation_token() -> str:
    """Génère un token d'invitation sécurisé"""
    # Générer un token aléatoire
    token = secrets.token_urlsafe(32)
    
    # Optionnel : hash le token avec le secret key pour plus de sécurité
    if settings.INVITATION_SECRET_KEY:
        combined = f"{token}{settings.INVITATION_SECRET_KEY}"
        token_hash = hashlib.sha256(combined.encode()).hexdigest()[:16]
        return f"{token}_{token_hash}"
    
    return token


def create_invitation_token(email: str, company_id: int) -> tuple[str, datetime]:
    """
    Crée un token d'invitation et retourne le token et la date d'expiration
    Expiration par défaut : 48 heures
    """
    token = generate_invitation_token()
    # Expiration de 48 heures
    expires_at = datetime.utcnow() + timedelta(hours=48)
    
    return token, expires_at


def is_invitation_valid(invitation: Invitation) -> bool:
    """Vérifie si une invitation est valide"""
    if invitation.status != InvitationStatus.PENDING:
        return False
    
    if invitation.expires_at < datetime.utcnow():
        return False
    
    return True


def get_invitation_link(token: str) -> str:
    """Génère le lien d'invitation"""
    # TODO: Remplacer par l'URL réelle du frontend
    base_url = "http://localhost:3000"
    return f"{base_url}/accept-invitation?token={token}"

