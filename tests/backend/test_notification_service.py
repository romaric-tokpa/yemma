"""
Tests d'intégration pour le service de notification

Ces tests nécessitent que les services backend soient en cours d'exécution.
Pour lancer ces tests:
    1. docker-compose up -d
    2. INTEGRATION_TESTS=true pytest tests/backend/test_notification_service.py -v
"""
import pytest
import os
from httpx import AsyncClient

# Skip tous les tests si les services ne sont pas démarrés
pytestmark = pytest.mark.skipif(
    os.getenv("INTEGRATION_TESTS", "false").lower() != "true",
    reason="Tests d'intégration désactivés. Lancez avec INTEGRATION_TESTS=true après avoir démarré les services."
)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_send_candidate_welcome_notification(client: AsyncClient, service_token: str):
    """Test d'envoi d'email de bienvenue candidat"""
    response = await client.post(
        "/api/v1/triggers/notify_candidate_welcome",
        json={
            "recipient_email": "test@example.com",
            "recipient_name": "Test User",
            "candidate_name": "Test User",
            "dashboard_url": "http://localhost:3000/candidate/dashboard"
        },
        headers={"X-Service-Token": service_token}
    )

    assert response.status_code in [200, 201]
    data = response.json()
    assert "message" in data or "sent" in data


@pytest.mark.integration
@pytest.mark.asyncio
async def test_send_company_welcome_notification(client: AsyncClient, service_token: str):
    """Test d'envoi d'email de bienvenue entreprise"""
    response = await client.post(
        "/api/v1/triggers/notify_company_welcome",
        json={
            "recipient_email": "company@example.com",
            "recipient_name": "Company Admin",
            "company_name": "Test Company",
            "dashboard_url": "http://localhost:3000/company/dashboard"
        },
        headers={"X-Service-Token": service_token}
    )

    assert response.status_code in [200, 201]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_send_profile_validated_notification(client: AsyncClient, service_token: str):
    """Test d'envoi d'email de validation de profil"""
    response = await client.post(
        "/api/v1/triggers/notify_profile_validated",
        json={
            "recipient_email": "candidate@example.com",
            "recipient_name": "Test Candidate",
            "candidate_name": "Test Candidate",
            "admin_score": 4.5
        },
        headers={"X-Service-Token": service_token}
    )

    assert response.status_code in [200, 201]
