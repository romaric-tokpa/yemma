"""
Endpoints de gestion des plans
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.schemas import PlanResponse
from app.core.exceptions import PlanNotFoundError
from app.infrastructure.database import get_session
from app.infrastructure.repositories import PlanRepository

router = APIRouter()


@router.get("", response_model=List[PlanResponse])
async def get_plans(session: AsyncSession = Depends(get_session)):
    """
    Récupère tous les plans actifs
    """
    repo = PlanRepository(session)
    plans = await repo.get_all_active()
    plans_list = [PlanResponse.model_validate(plan) for plan in plans]
    print(f"📋 Plans retournés par l'API: {[p.name for p in plans_list]}")
    return plans_list


@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(plan_id: int, session: AsyncSession = Depends(get_session)):
    """
    Récupère un plan par ID
    """
    repo = PlanRepository(session)
    plan = await repo.get_by_id(plan_id)
    
    if not plan:
        raise PlanNotFoundError(str(plan_id))
    
    return PlanResponse.model_validate(plan)

