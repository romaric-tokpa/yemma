"""
Endpoints de statistiques pour le service Candidate
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, or_, and_
from typing import Dict, List, Optional, Any

from app.infrastructure.database import get_session
from app.infrastructure.internal_auth import verify_internal_token
from app.infrastructure.auth import get_current_user, TokenData
from app.domain.models import Profile, ProfileStatus

router = APIRouter()


def _parse_date(value: Optional[str]):
    if not value:
        return None
    try:
        return datetime.strptime(value.strip()[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def _format_period(dt, group_by: str) -> str:
    if not dt:
        return ""
    d = dt.date() if hasattr(dt, "date") else dt
    if group_by == "year":
        return str(d.year) if hasattr(d, "year") else str(d)[:4]
    if group_by == "month":
        return f"{d.year:04d}-{d.month:02d}" if hasattr(d, "year") and hasattr(d, "month") else str(d)[:7]
    return d.isoformat() if hasattr(d, "isoformat") else str(d)[:10]


@router.get("/profiles/stats", response_model=Dict[str, int])
async def get_profiles_stats(
    session: AsyncSession = Depends(get_session),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    Récupère les statistiques des profils par statut
    
    Accessible aux administrateurs (ROLE_ADMIN, ROLE_SUPER_ADMIN)
    """
    # Vérifier que c'est un admin
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # S'assurer que roles est une liste
    user_roles = current_user.roles if isinstance(current_user.roles, list) else []
    if "ROLE_ADMIN" not in user_roles and "ROLE_SUPER_ADMIN" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access this resource"
        )
    
    # Compter les profils par statut
    statement = select(
        Profile.status,
        func.count(Profile.id).label('count')
    ).where(
        Profile.deleted_at.is_(None)  # Exclure les profils supprimés (soft delete)
    ).group_by(Profile.status)
    
    result = await session.execute(statement)
    rows = result.all()
    
    # Initialiser tous les statuts à 0
    stats = {
        "DRAFT": 0,
        "SUBMITTED": 0,
        "IN_REVIEW": 0,
        "VALIDATED": 0,
        "REJECTED": 0,
        "ARCHIVED": 0
    }
    
    # Mettre à jour avec les valeurs réelles
    for row in rows:
        status_value = row.status.value if isinstance(row.status, ProfileStatus) else str(row.status)
        count = row.count
        if status_value in stats:
            stats[status_value] = count
    
    return stats


@router.get("/profiles/stats/by-sector", response_model=List[Dict[str, Any]])
async def get_profiles_stats_by_sector(
    session: AsyncSession = Depends(get_session),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    Récupère le nombre de candidats inscrits et validés par secteur d'activité.
    Accessible aux administrateurs (ROLE_ADMIN, ROLE_SUPER_ADMIN).
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    user_roles = current_user.roles if isinstance(current_user.roles, list) else []
    if "ROLE_ADMIN" not in user_roles and "ROLE_SUPER_ADMIN" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access this resource"
        )

    # Libellé secteur : null ou vide -> "Non renseigné"
    sector_label = case(
        (or_(Profile.sector.is_(None), Profile.sector == ""), "Non renseigné"),
        else_=Profile.sector
    )
    statement = select(
        sector_label.label("sector"),
        Profile.status,
        func.count(Profile.id).label("count"),
    ).where(
        Profile.deleted_at.is_(None)
    ).group_by(sector_label, Profile.status)

    result = await session.execute(statement)
    rows = result.all()

    # Agrégation par secteur: { sector: { total, validated, archived } }
    by_sector: Dict[str, Dict[str, int]] = {}
    for row in rows:
        sector = row.sector or "Non renseigné"
        status_value = row.status.value if isinstance(row.status, ProfileStatus) else str(row.status)
        count = row.count or 0
        if sector not in by_sector:
            by_sector[sector] = {"total": 0, "validated": 0, "archived": 0}
        by_sector[sector]["total"] += count
        if status_value == "VALIDATED":
            by_sector[sector]["validated"] += count
        if status_value == "ARCHIVED":
            by_sector[sector]["archived"] += count

    # Liste triée par total décroissant
    out = [
        {"sector": sector, "total": data["total"], "validated": data["validated"], "archived": data.get("archived", 0)}
        for sector, data in by_sector.items()
    ]
    out.sort(key=lambda x: (-x["total"], x["sector"]))
    return out


@router.get("/profiles/stats/by-period", response_model=List[Dict[str, Any]])
async def get_profiles_stats_by_period(
    from_date: Optional[str] = Query(None, description="Date de début (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="Date de fin (YYYY-MM-DD)"),
    group_by: str = Query("month", description="Regrouper par: day, month, year"),
    session: AsyncSession = Depends(get_session),
    current_user: Optional[TokenData] = Depends(get_current_user),
):
    """
    Statistiques d'inscriptions, validations et rejets par période.
    Filtrable par plage de dates, regroupement par jour, mois ou année.
    Accessible aux administrateurs (ROLE_ADMIN, ROLE_SUPER_ADMIN).
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    user_roles = current_user.roles if isinstance(current_user.roles, list) else []
    if "ROLE_ADMIN" not in user_roles and "ROLE_SUPER_ADMIN" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access this resource",
        )
    if group_by not in ("day", "month", "year"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="group_by must be one of: day, month, year",
        )

    from_date_parsed = _parse_date(from_date)
    to_date_parsed = _parse_date(to_date)
    if not from_date_parsed or not to_date_parsed:
        # Par défaut: 12 derniers mois
        end = datetime.utcnow().date()
        start = end - timedelta(days=365)
        from_date_parsed = start
        to_date_parsed = end
    if from_date_parsed > to_date_parsed:
        from_date_parsed, to_date_parsed = to_date_parsed, from_date_parsed

    # Pour inclure to_date jusqu'à 23:59:59, on utilise le lendemain en exclus
    to_datetime = datetime.combine(to_date_parsed, datetime.max.time())
    from_datetime = datetime.combine(from_date_parsed, datetime.min.time())

    trunc = "day" if group_by == "day" else "month" if group_by == "month" else "year"
    date_trunc = func.date_trunc(trunc, Profile.created_at)

    # Inscriptions: group by date_trunc(created_at)
    q_created = select(
        date_trunc.label("period"),
        func.count(Profile.id).label("count"),
    ).where(
        and_(
            Profile.deleted_at.is_(None),
            Profile.created_at.isnot(None),
            Profile.created_at >= from_datetime,
            Profile.created_at <= to_datetime,
        )
    ).group_by(date_trunc)

    r_created = await session.execute(q_created)
    rows_created = r_created.all()

    # Validations: group by date_trunc(validated_at)
    date_trunc_val = func.date_trunc(trunc, Profile.validated_at)
    q_validated = select(
        date_trunc_val.label("period"),
        func.count(Profile.id).label("count"),
    ).where(
        and_(
            Profile.deleted_at.is_(None),
            Profile.validated_at.isnot(None),
            Profile.validated_at >= from_datetime,
            Profile.validated_at <= to_datetime,
        )
    ).group_by(date_trunc_val)

    r_validated = await session.execute(q_validated)
    rows_validated = r_validated.all()

    # Rejets: group by date_trunc(rejected_at)
    date_trunc_rej = func.date_trunc(trunc, Profile.rejected_at)
    q_rejected = select(
        date_trunc_rej.label("period"),
        func.count(Profile.id).label("count"),
    ).where(
        and_(
            Profile.deleted_at.is_(None),
            Profile.rejected_at.isnot(None),
            Profile.rejected_at >= from_datetime,
            Profile.rejected_at <= to_datetime,
        )
    ).group_by(date_trunc_rej)

    r_rejected = await session.execute(q_rejected)
    rows_rejected = r_rejected.all()

    # Construire le dictionnaire période -> { inscriptions, validated, rejected }
    by_period: Dict[str, Dict[str, int]] = {}

    def add_period(key: str, dt, count: int):
        if dt is None:
            return
        if hasattr(dt, "date"):
            dt = dt.date()
        if hasattr(dt, "isoformat"):
            period_str = _format_period(dt, group_by)
        else:
            period_str = _format_period(dt, group_by)
        if not period_str:
            return
        if period_str not in by_period:
            by_period[period_str] = {"period": period_str, "inscriptions": 0, "validated": 0, "rejected": 0}
        by_period[period_str][key] = count

    for row in rows_created:
        add_period("inscriptions", row.period, row.count or 0)
    for row in rows_validated:
        add_period("validated", row.period, row.count or 0)
    for row in rows_rejected:
        add_period("rejected", row.period, row.count or 0)

    # Toutes les périodes entre from et to (pour avoir des lignes à 0)
    periods_set = set(by_period.keys())
    if group_by == "day":
        d = from_date_parsed
        while d <= to_date_parsed:
            p = d.isoformat()
            periods_set.add(p)
            d += timedelta(days=1)
    elif group_by == "month":
        y, m = from_date_parsed.year, from_date_parsed.month
        ey, em = to_date_parsed.year, to_date_parsed.month
        while (y, m) <= (ey, em):
            periods_set.add(f"{y:04d}-{m:02d}")
            if m == 12:
                m = 1
                y += 1
            else:
                m += 1
    else:
        for y in range(from_date_parsed.year, to_date_parsed.year + 1):
            periods_set.add(str(y))

    for p in periods_set:
        if p not in by_period:
            by_period[p] = {"period": p, "inscriptions": 0, "validated": 0, "rejected": 0}

    out = [by_period[p] for p in sorted(by_period.keys())]
    return out

