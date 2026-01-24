"""
Tests d'intégration pour le service entreprise

Ces tests nécessitent que les services backend soient en cours d'exécution.
Pour lancer ces tests:
    1. docker-compose up -d
    2. INTEGRATION_TESTS=true pytest tests/backend/test_company_service.py -v
"""
import pytest
import os
from httpx import AsyncClient
from faker import Faker

fake = Faker('fr_FR')

# Skip tous les tests si les services ne sont pas démarrés
pytestmark = pytest.mark.skipif(
    os.getenv("INTEGRATION_TESTS", "false").lower() != "true",
    reason="Tests d'intégration désactivés. Lancez avec INTEGRATION_TESTS=true après avoir démarré les services."
)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_company_success(client: AsyncClient, company_auth_token: str):
    """Test de création d'une entreprise"""
    response = await client.post(
        "/api/v1/companies",
        json={
            "name": fake.company(),
            "sector": "Technologie",
            "size": "50-200",
            "address": fake.address(),
            "city": fake.city(),
            "country": "France"
        },
        headers={"Authorization": f"Bearer {company_auth_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "name" in data


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_my_company(client: AsyncClient, company_auth_token: str):
    """Test de récupération de l'entreprise de l'utilisateur connecté"""
    response = await client.get(
        "/api/v1/companies/me",
        headers={"Authorization": f"Bearer {company_auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "id" in data


@pytest.mark.integration
@pytest.mark.asyncio
async def test_invite_recruiter_success(client: AsyncClient, company_auth_token: str, company_id: int):
    """Test d'invitation d'un recruteur"""
    email = fake.email()
    response = await client.post(
        f"/api/v1/companies/{company_id}/invitations",
        json={
            "email": email,
            "role": "ROLE_RECRUITER"
        },
        headers={"Authorization": f"Bearer {company_auth_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == email
    assert data["status"] == "PENDING"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_team_members(client: AsyncClient, company_auth_token: str, company_id: int):
    """Test de récupération des membres de l'équipe"""
    response = await client.get(
        f"/api/v1/companies/{company_id}/recruiters",
        headers={"Authorization": f"Bearer {company_auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
