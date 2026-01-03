"""
Endpoints de statistiques pour le tableau de bord Admin
"""
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
import httpx

from app.core.config import settings
from app.infrastructure.internal_auth import verify_internal_token

# Import pour l'authentification interne
import sys
import os
shared_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "shared")
if shared_path not in sys.path:
    sys.path.insert(0, shared_path)

from services.shared.internal_auth import get_service_token_header

router = APIRouter()


@router.get("/stats/dashboard")
async def get_dashboard_stats(
    service_info: dict = Depends(verify_internal_token)
):
    """
    Récupère les statistiques agrégées pour le tableau de bord Admin
    
    Agrège les données de plusieurs services :
    - Nombre total de profils par statut (Candidate Service)
    - Revenus mensuels (Payment Service)
    - Taux de conversion (Soumissions vs Validations)
    - Top 10 des compétences les plus recherchées (Search Service)
    
    Nécessite un token de service interne
    """
    headers = get_service_token_header("admin-service")
    
    dashboard_stats = {
        "profiles_by_status": {},
        "monthly_revenue": [],
        "conversion_rate": 0.0,
        "top_skills": []
    }
    
    errors = []
    
    # 1. Récupérer les stats des profils par statut
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.CANDIDATE_SERVICE_URL}/api/v1/profiles/stats",
                headers=headers
            )
            if response.status_code == 200:
                dashboard_stats["profiles_by_status"] = response.json()
            else:
                errors.append(f"Candidate Service: {response.status_code}")
    except Exception as e:
        errors.append(f"Candidate Service error: {str(e)}")
    
    # 2. Récupérer les revenus mensuels
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.PAYMENT_SERVICE_URL}/api/v1/payments/stats/revenue/monthly?months=12",
                headers=headers
            )
            if response.status_code == 200:
                dashboard_stats["monthly_revenue"] = response.json()
            else:
                errors.append(f"Payment Service: {response.status_code}")
    except Exception as e:
        errors.append(f"Payment Service error: {str(e)}")
    
    # 3. Calculer le taux de conversion
    try:
        profiles_by_status = dashboard_stats.get("profiles_by_status", {})
        submitted = profiles_by_status.get("SUBMITTED", 0)
        validated = profiles_by_status.get("VALIDATED", 0)
        
        if submitted > 0:
            conversion_rate = (validated / submitted) * 100
            dashboard_stats["conversion_rate"] = round(conversion_rate, 2)
        else:
            dashboard_stats["conversion_rate"] = 0.0
    except Exception as e:
        errors.append(f"Conversion rate calculation error: {str(e)}")
    
    # 4. Récupérer le top 10 des compétences
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.SEARCH_SERVICE_URL}/api/v1/search/stats/skills/top?limit=10",
                headers=headers
            )
            if response.status_code == 200:
                dashboard_stats["top_skills"] = response.json()
            else:
                errors.append(f"Search Service: {response.status_code}")
    except Exception as e:
        errors.append(f"Search Service error: {str(e)}")
    
    # Si toutes les requêtes ont échoué, retourner une erreur
    if len(errors) == 4:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="All services are unavailable",
            headers={"X-Errors": ", ".join(errors)}
        )
    
    # Ajouter les erreurs dans la réponse si certaines requêtes ont échoué
    if errors:
        dashboard_stats["warnings"] = errors
    
    return dashboard_stats

