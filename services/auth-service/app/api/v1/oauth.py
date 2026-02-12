"""
OAuth Google et LinkedIn pour les candidats
"""
import json
import base64
import logging
from urllib.parse import urlencode, quote
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.domain.models import User, RefreshToken, UserStatus
from app.infrastructure.database import get_session
from app.infrastructure.security import create_access_token, create_refresh_token
from app.infrastructure.repositories import UserRepository, RoleRepository, RefreshTokenRepository
from app.infrastructure.security import hash_password
from app.core.config import settings
from datetime import datetime, timedelta

# Hash invalide pour les comptes OAuth (ils ne peuvent pas se connecter par mot de passe)
OAUTH_PASSWORD_PLACEHOLDER = "oauth_no_password"

router = APIRouter()
_log = logging.getLogger(__name__)


def _get_auth_base_url() -> str:
    """URL de base du service auth (pour les redirect_uri OAuth)"""
    if settings.AUTH_SERVICE_EXTERNAL_URL:
        return settings.AUTH_SERVICE_EXTERNAL_URL.rstrip("/")
    return "http://localhost:8001"


@router.get("/oauth/google")
async def oauth_google_initiate(
    role: str = "ROLE_CANDIDAT",
    redirect_uri: str = None,
):
    """Redirige vers Google OAuth pour l'inscription/connexion candidat"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Connexion Google non configurée"
        )
    frontend_callback = redirect_uri or f"{settings.FRONTEND_URL}/register/candidat/oauth-callback"
    state = base64.urlsafe_b64encode(
        json.dumps({"role": role, "redirect_uri": frontend_callback}).encode()
    ).decode()
    auth_base = _get_auth_base_url()
    backend_callback = f"{auth_base}/api/v1/auth/oauth/google/callback"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": backend_callback,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url=url)


@router.get("/oauth/google/callback")
async def oauth_google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Callback Google : échange le code contre les tokens, crée/récupère l'utilisateur, redirige vers le frontend"""
    try:
        return await _oauth_google_callback_impl(code, state, error, session)
    except Exception as e:
        _log.exception("OAuth Google callback error: %s", e)
        from urllib.parse import quote
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=server_error&detail={quote(str(e)[:150])}"
        )


async def _oauth_google_callback_impl(code, state, error, session):
    """Implémentation du callback Google"""
    if error:
        _log.warning("OAuth Google error: %s", error)
        frontend_url = f"{settings.FRONTEND_URL}/register/candidat?oauth_error=cancelled"
        return RedirectResponse(url=frontend_url)
    if not code or not state:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=missing_params")
    try:
        state_data = json.loads(base64.urlsafe_b64decode(state + "==").decode())
        role = state_data.get("role", "ROLE_CANDIDAT")
        frontend_redirect = state_data.get("redirect_uri", f"{settings.FRONTEND_URL}/register/candidat/oauth-callback")
    except Exception:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=invalid_state")

    auth_base = _get_auth_base_url()
    backend_callback = f"{auth_base}/api/v1/auth/oauth/google/callback"
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": backend_callback,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_resp.status_code != 200:
            err_body = token_resp.text
            _log.warning("Google token exchange failed [%s]: %s", token_resp.status_code, err_body)
            try:
                err_json = token_resp.json()
                err_msg = err_json.get("error_description", err_json.get("error", "unknown"))
            except Exception:
                err_msg = err_body[:100] if err_body else "unknown"
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=token_exchange&detail={quote(str(err_msg))}"
            )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=no_token")

        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_resp.status_code != 200:
            _log.warning("Google userinfo failed: %s", userinfo_resp.text)
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=userinfo")
        ui = userinfo_resp.json()
        email = ui.get("email")
        oauth_id = ui.get("id")
        first_name = ui.get("given_name") or ""
        last_name = ui.get("family_name") or ""
        if not email:
            email = f"{oauth_id}@google.oauth"
        if not oauth_id:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=no_email")

    user_repo = UserRepository(session)
    role_repo = RoleRepository(session)
    refresh_token_repo = RefreshTokenRepository(session)

    user = await user_repo.get_by_oauth("google", oauth_id)
    if not user:
        existing = await user_repo.get_by_email(email)
        if existing:
            if existing.hashed_password:
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=email_exists&message=exists_password"
                )
            # Lier le compte OAuth existant par email (même email, autre provider)
            user = existing
            user.oauth_provider = "google"
            user.oauth_id = oauth_id
            user.first_name = user.first_name or first_name
            user.last_name = user.last_name or last_name
            await user_repo.update(user)
        else:
            user = User(
                email=email,
                hashed_password=hash_password(OAUTH_PASSWORD_PLACEHOLDER),
                first_name=first_name or None,
                last_name=last_name or None,
                oauth_provider="google",
                oauth_id=oauth_id,
                status=UserStatus.PENDING_VERIFICATION,
                is_email_verified=True,
            )
            from app.domain.models import UserRoleLink
            user = await user_repo.create(user, skip_email_check=True)
            r = await role_repo.get_or_create(role)
            session.add(UserRoleLink(user_id=user.id, role_id=r.id))
            await session.commit()

            # Envoyer l'email d'inscription après création du compte (comme pour inscription manuelle)
            try:
                from app.infrastructure.notification_client import send_candidate_registration_notification
                candidate_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email.split("@")[0]
                await send_candidate_registration_notification(
                    candidate_email=user.email,
                    candidate_name=candidate_name,
                )
            except Exception as e:
                _log.warning("Failed to send candidate registration email (Google OAuth): %s", e)

    roles = await user_repo.get_user_roles(user.id)
    role_names = [r.name for r in roles]
    token_data = {"sub": str(user.id), "email": user.email, "roles": role_names}
    access_token_jwt = create_access_token(token_data)
    refresh_token_str = create_refresh_token(token_data)
    rt = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    )
    await refresh_token_repo.create(rt)

    sep = "&" if "?" in frontend_redirect else "?"
    redirect_url = f"{frontend_redirect}{sep}access_token={access_token_jwt}&refresh_token={refresh_token_str}&expires_in={settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60}"
    return RedirectResponse(url=redirect_url)


@router.get("/oauth/linkedin")
async def oauth_linkedin_initiate(
    role: str = "ROLE_CANDIDAT",
    redirect_uri: str = None,
):
    """Redirige vers LinkedIn OAuth pour l'inscription/connexion candidat"""
    if not settings.LINKEDIN_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Connexion LinkedIn non configurée"
        )
    frontend_callback = redirect_uri or f"{settings.FRONTEND_URL}/register/candidat/oauth-callback"
    state = base64.urlsafe_b64encode(
        json.dumps({"role": role, "redirect_uri": frontend_callback}).encode()
    ).decode()
    auth_base = _get_auth_base_url()
    backend_callback = f"{auth_base}/api/v1/auth/oauth/linkedin/callback"
    params = {
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": backend_callback,
        "state": state,
        "scope": "openid profile email",
    }
    url = "https://www.linkedin.com/oauth/v2/authorization?" + urlencode(params)
    return RedirectResponse(url=url)


@router.get("/oauth/linkedin/callback")
async def oauth_linkedin_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Callback LinkedIn : échange le code, récupère userinfo, crée/récupère l'utilisateur"""
    if error:
        _log.warning("OAuth LinkedIn error: %s", error)
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=cancelled")
    if not code or not state:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=missing_params")
    try:
        state_data = json.loads(base64.urlsafe_b64decode(state + "==").decode())
        role = state_data.get("role", "ROLE_CANDIDAT")
        frontend_redirect = state_data.get("redirect_uri", f"{settings.FRONTEND_URL}/register/candidat/oauth-callback")
    except Exception:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=invalid_state")

    auth_base = _get_auth_base_url()
    backend_callback = f"{auth_base}/api/v1/auth/oauth/linkedin/callback"
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": settings.LINKEDIN_CLIENT_ID,
                "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                "redirect_uri": backend_callback,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_resp.status_code != 200:
            _log.warning("LinkedIn token exchange failed: %s", token_resp.text)
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=token_exchange")
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=no_token")

        userinfo_resp = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_resp.status_code != 200:
            _log.warning("LinkedIn userinfo failed: %s", userinfo_resp.text)
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=userinfo")
        ui = userinfo_resp.json()
        email = ui.get("email")
        oauth_id = ui.get("sub")
        first_name = ui.get("given_name") or ""
        last_name = ui.get("family_name") or ""
        if not email:
            email = f"{oauth_id}@linkedin.oauth"
        if not oauth_id:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=no_email")

    user_repo = UserRepository(session)
    role_repo = RoleRepository(session)
    refresh_token_repo = RefreshTokenRepository(session)

    user = await user_repo.get_by_oauth("linkedin", oauth_id)
    if not user:
        existing = await user_repo.get_by_email(email)
        if existing:
            if existing.hashed_password:
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/register/candidat?oauth_error=email_exists&message=exists_password"
                )
            user = existing
            user.oauth_provider = "linkedin"
            user.oauth_id = oauth_id
            user.first_name = user.first_name or first_name
            user.last_name = user.last_name or last_name
            await user_repo.update(user)
        else:
            user = User(
                email=email,
                hashed_password=hash_password(OAUTH_PASSWORD_PLACEHOLDER),
                first_name=first_name or None,
                last_name=last_name or None,
                oauth_provider="linkedin",
                oauth_id=oauth_id,
                status=UserStatus.PENDING_VERIFICATION,
                is_email_verified=True,
            )
            user = await user_repo.create(user, skip_email_check=True)
            from app.domain.models import UserRoleLink
            r = await role_repo.get_or_create(role)
            session.add(UserRoleLink(user_id=user.id, role_id=r.id))
            await session.commit()

            # Envoyer l'email d'inscription après création du compte (comme pour inscription manuelle)
            try:
                from app.infrastructure.notification_client import send_candidate_registration_notification
                candidate_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email.split("@")[0]
                await send_candidate_registration_notification(
                    candidate_email=user.email,
                    candidate_name=candidate_name,
                )
            except Exception as e:
                _log.warning("Failed to send candidate registration email (LinkedIn OAuth): %s", e)

    roles = await user_repo.get_user_roles(user.id)
    role_names = [r.name for r in roles]
    token_data = {"sub": str(user.id), "email": user.email, "roles": role_names}
    access_token_jwt = create_access_token(token_data)
    refresh_token_str = create_refresh_token(token_data)
    rt = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    )
    await refresh_token_repo.create(rt)

    sep = "&" if "?" in frontend_redirect else "?"
    redirect_url = f"{frontend_redirect}{sep}access_token={access_token_jwt}&refresh_token={refresh_token_str}&expires_in={settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60}"
    return RedirectResponse(url=redirect_url)
