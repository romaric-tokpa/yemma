"""
Endpoints de statistiques pour le service Payment
"""
from datetime import datetime, timedelta
from typing import List, Dict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from pydantic import BaseModel

from app.infrastructure.database import get_session
from app.infrastructure.internal_auth import verify_internal_token
from app.domain.models import Payment, PaymentStatus

router = APIRouter()


class MonthlyRevenue(BaseModel):
    """Revenu mensuel"""
    month: str  # Format: "YYYY-MM"
    year: int
    month_number: int
    revenue: float
    payment_count: int


@router.get("/revenue/monthly", response_model=List[MonthlyRevenue])
async def get_monthly_revenue(
    months: int = Query(12, ge=1, le=24, description="Nombre de mois à récupérer"),
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère les revenus mensuels des paiements réussis
    
    Nécessite un token de service interne
    """
    # Calculer la date de début
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=months * 30)
    
    # Requête pour agréger les revenus par mois
    statement = select(
        extract('year', Payment.payment_date).label('year'),
        extract('month', Payment.payment_date).label('month'),
        func.sum(Payment.amount).label('revenue'),
        func.count(Payment.id).label('payment_count')
    ).where(
        and_(
            Payment.status == PaymentStatus.SUCCEEDED,
            Payment.payment_date.isnot(None),
            Payment.payment_date >= start_date,
            Payment.payment_date <= end_date
        )
    ).group_by(
        extract('year', Payment.payment_date),
        extract('month', Payment.payment_date)
    ).order_by(
        extract('year', Payment.payment_date).desc(),
        extract('month', Payment.payment_date).desc()
    )
    
    result = await session.execute(statement)
    rows = result.all()
    
    monthly_revenues = []
    for row in rows:
        year = int(row.year)
        month = int(row.month)
        revenue = float(row.revenue) if row.revenue else 0.0
        payment_count = int(row.payment_count) if row.payment_count else 0
        
        monthly_revenues.append(MonthlyRevenue(
            month=f"{year}-{month:02d}",
            year=year,
            month_number=month,
            revenue=revenue,
            payment_count=payment_count
        ))
    
    return monthly_revenues

