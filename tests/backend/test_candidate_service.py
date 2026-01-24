"""
Tests d'intégration pour le service candidat

Ces tests nécessitent que les services backend soient en cours d'exécution.
Pour lancer ces tests:
    1. docker-compose up -d
    2. INTEGRATION_TESTS=true pytest tests/backend/test_candidate_service.py -v
"""
import pytest
import os
from httpx import AsyncClient
from faker import Faker
from datetime import datetime, date

fake = Faker('fr_FR')

# Skip tous les tests si les services ne sont pas démarrés
pytestmark = pytest.mark.skipif(
    os.getenv("INTEGRATION_TESTS", "false").lower() != "true",
    reason="Tests d'intégration désactivés. Lancez avec INTEGRATION_TESTS=true après avoir démarré les services."
)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_profile_success(client: AsyncClient, auth_token: str):
    """Test de création d'un profil candidat"""
    response = await client.post(
        "/api/v1/profiles",
        json={
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
            "email": fake.email(),
            "date_of_birth": "1990-01-01",
            "nationality": "Française",
            "phone": "+33612345678",
            "address": fake.address(),
            "city": fake.city(),
            "country": "France"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "DRAFT"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_my_profile(client: AsyncClient, auth_token: str):
    """Test de récupération du profil de l'utilisateur connecté"""
    response = await client.get(
        "/api/v1/profiles/me",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "id" in data


@pytest.mark.integration
@pytest.mark.asyncio
async def test_update_profile(client: AsyncClient, auth_token: str, profile_id: int):
    """Test de mise à jour du profil"""
    new_title = fake.job()
    response = await client.patch(
        "/api/v1/profiles/me",
        json={
            "step1": {
                "profile_title": new_title
            }
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["profile_title"] == new_title


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_experience(client: AsyncClient, auth_token: str, profile_id: int):
    """Test de création d'une expérience professionnelle"""
    response = await client.post(
        f"/api/v1/profiles/{profile_id}/experiences",
        json={
            "company_name": fake.company(),
            "position": fake.job(),
            "start_date": "2020-01-01T00:00:00Z",
            "is_current": False,
            "end_date": "2022-12-31T00:00:00Z",
            "description": fake.text()
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert "id" in data


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_experience_current_no_end_date(client: AsyncClient, auth_token: str, profile_id: int):
    """Test de création d'une expérience en cours sans date de fin"""
    response = await client.post(
        f"/api/v1/profiles/{profile_id}/experiences",
        json={
            "company_name": fake.company(),
            "position": fake.job(),
            "start_date": "2023-01-01T00:00:00Z",
            "is_current": True,
            "description": fake.text()
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["is_current"] is True
    assert data.get("end_date") is None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_skill_technical(client: AsyncClient, auth_token: str, profile_id: int):
    """Test de création d'une compétence technique"""
    response = await client.post(
        f"/api/v1/profiles/{profile_id}/skills",
        json={
            "name": "Python",
            "skill_type": "TECHNICAL",
            "level": "ADVANCED",
            "years_of_practice": 5
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["skill_type"] == "TECHNICAL"
    assert data["level"] == "ADVANCED"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_skill_soft(client: AsyncClient, auth_token: str, profile_id: int):
    """Test de création d'une compétence comportementale (soft skill)"""
    response = await client.post(
        f"/api/v1/profiles/{profile_id}/skills",
        json={
            "name": "Communication",
            "skill_type": "SOFT"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["skill_type"] == "SOFT"
    assert data.get("level") is None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_submit_profile_success(client: AsyncClient, auth_token: str, complete_profile_id: int):
    """Test de soumission d'un profil complet"""
    response = await client.post(
        f"/api/v1/profiles/{complete_profile_id}/submit",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUBMITTED"
    assert data.get("submitted_at") is not None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_submit_profile_incomplete(client: AsyncClient, auth_token: str, incomplete_profile_id: int):
    """Test de soumission d'un profil incomplet (doit échouer)"""
    response = await client.post(
        f"/api/v1/profiles/{incomplete_profile_id}/submit",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "incomplet" in detail or "complet" in detail
