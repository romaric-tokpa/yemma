"""
Endpoints pour les factures
"""
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.schemas import InvoiceResponse
from app.infrastructure.database import get_session
from app.infrastructure.repositories import InvoiceRepository

router = APIRouter()


@router.get("/company/{company_id}", response_model=List[InvoiceResponse])
async def get_company_invoices(
    company_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère toutes les factures d'une entreprise
    
    Les factures sont triées par date décroissante (plus récentes en premier)
    """
    invoice_repo = InvoiceRepository(session)
    invoices = await invoice_repo.get_by_company_id(company_id)
    
    # Trier par date décroissante
    invoices_sorted = sorted(invoices, key=lambda x: x.invoice_date, reverse=True)
    
    return [InvoiceResponse.model_validate(inv) for inv in invoices_sorted]

