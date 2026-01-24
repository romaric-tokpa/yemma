"""
Tests fonctionnels pour le flux d'onboarding complet
"""
import pytest
from httpx import AsyncClient
from faker import Faker

fake = Faker('fr_FR')

@pytest.mark.functional
@pytest.mark.asyncio
async def test_complete_onboarding_flow(client: AsyncClient):
    """Test du flux d'onboarding complet d'un candidat"""
    # 1. Inscription
    email = fake.email()
    password = "TestPassword123!"
    
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "role": "ROLE_CANDIDAT"
        }
    )
    assert register_response.status_code == 201
    
    # 2. Connexion
    login_response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": email,
            "password": password
        }
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Création du profil (Step 0 & 1)
    profile_response = await client.post(
        "/api/v1/profiles",
        json={
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
            "email": email,
            "date_of_birth": "1990-01-01",
            "nationality": "Française",
            "phone": "+33612345678",
            "address": fake.address(),
            "city": fake.city(),
            "country": "France",
            "profile_title": "Développeur Fullstack",
            "professional_summary": "Expérience en développement web avec Python, React et Node.js. Passionné par les technologies modernes et les bonnes pratiques de développement. " * 3,
            "sector": "Technologie",
            "main_job": "Développeur",
            "total_experience": 5,
            "accept_cgu": True,
            "accept_rgpd": True,
            "accept_verification": True,
        },
        headers=headers
    )
    assert profile_response.status_code == 201
    profile_id = profile_response.json()["id"]
    
    # 4. Ajout d'une expérience (Step 2)
    experience_response = await client.post(
        f"/api/v1/profiles/{profile_id}/experiences",
        json={
            "company_name": fake.company(),
            "position": "Développeur Senior",
            "start_date": "2020-01-01T00:00:00Z",
            "is_current": False,
            "end_date": "2022-12-31T00:00:00Z",
            "description": "Développement d'applications web avec React et Node.js"
        },
        headers=headers
    )
    assert experience_response.status_code == 201
    
    # 5. Ajout d'une formation (Step 3)
    education_response = await client.post(
        f"/api/v1/profiles/{profile_id}/educations",
        json={
            "diploma": "Master en Informatique",
            "institution": "Université Test",
            "country": "France",
            "graduation_year": 2015,
            "level": "Bac+5"
        },
        headers=headers
    )
    assert education_response.status_code == 201
    
    # 6. Ajout d'une compétence technique (Step 5)
    skill_response = await client.post(
        f"/api/v1/profiles/{profile_id}/skills",
        json={
            "name": "Python",
            "skill_type": "TECHNICAL",
            "level": "ADVANCED",
            "years_of_practice": 5
        },
        headers=headers
    )
    assert skill_response.status_code == 201
    
    # 7. Upload d'un CV (Step 6)
    from io import BytesIO
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\ntrailer\n<<\n/Root 1 0 R\n>>\nstartxref\n9\n%%EOF"
    files = {
        "file": ("cv.pdf", BytesIO(pdf_content), "application/pdf")
    }
    data = {
        "candidate_id": profile_id,
        "document_type": "CV"
    }
    document_response = await client.post(
        "/api/v1/documents/upload",
        files=files,
        data=data,
        headers=headers
    )
    assert document_response.status_code == 201
    
    # 8. Ajout des préférences (Step 7)
    preferences_response = await client.post(
        f"/api/v1/profiles/{profile_id}/job-preferences",
        json={
            "desired_positions": ["Développeur Fullstack", "Tech Lead"],
            "contract_type": "CDI",
            "desired_location": "Paris",
            "availability": "immediate",
            "salary_min": 50000,
            "salary_max": 80000
        },
        headers=headers
    )
    assert preferences_response.status_code in [200, 201]
    
    # 9. Soumission du profil
    submit_response = await client.post(
        f"/api/v1/profiles/{profile_id}/submit",
        headers=headers
    )
    assert submit_response.status_code == 200
    assert submit_response.json()["status"] == "SUBMITTED"

@pytest.mark.functional
@pytest.mark.asyncio
async def test_company_onboarding_flow(client: AsyncClient):
    """Test du flux d'onboarding d'une entreprise"""
    # 1. Inscription
    email = fake.email()
    password = "TestPassword123!"
    
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "role": "ROLE_COMPANY_ADMIN"
        }
    )
    assert register_response.status_code == 201
    
    # 2. Connexion
    login_response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": email,
            "password": password
        }
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Création de l'entreprise
    company_response = await client.post(
        "/api/v1/companies",
        json={
            "name": fake.company(),
            "sector": "Technologie",
            "size": "50-200",
            "address": fake.address(),
            "city": fake.city(),
            "country": "France"
        },
        headers=headers
    )
    assert company_response.status_code == 201
    assert "id" in company_response.json()
