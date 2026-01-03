"""
Endpoints pour les factures (accès réservé au compte maître)
"""
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, TokenData
from app.infrastructure.permissions import require_company_master, can_access_invoices
from app.infrastructure.repositories import CompanyRepository

router = APIRouter()


@router.get("/company/{company_id}/invoices")
async def get_company_invoices(
    company_id: int,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère les factures d'une entreprise
    
    Seul le compte maître (COMPANY_ADMIN) peut accéder aux factures
    """
    # Vérifier les permissions
    if not can_access_invoices(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company master can access invoices"
        )
    
    # Vérifier que l'utilisateur est le compte maître de l'entreprise
    company = await require_company_master(company_id, current_user, session)
    
    # TODO: Appeler le service de paiement/abonnement pour récupérer les factures
    # Pour l'instant, on retourne un placeholder
    return {
        "company_id": company_id,
        "company_name": company.name,
        "invoices": [
            # Les factures seront récupérées depuis le payment-service
        ],
        "message": "Invoice data will be fetched from payment service"
    }

