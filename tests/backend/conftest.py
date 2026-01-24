"""
Configuration pytest pour les tests backend

Ces tests sont conçus pour fonctionner de deux manières:
1. Tests unitaires: Utilisent des mocks et ASGITransport (pas besoin de services externes)
2. Tests d'intégration: Nécessitent que les services soient en cours d'exécution (docker-compose up)

Par défaut, les tests utilisent des mocks. Pour les tests d'intégration, lancez:
    docker-compose up -d
    pytest tests/backend/ -m integration
"""
import pytest
import sys
import os
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock

# Ajouter le répertoire racine du projet au PYTHONPATH
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from faker import Faker

fake = Faker('fr_FR')

# Variable pour activer les tests d'intégration
INTEGRATION_TESTS = os.getenv("INTEGRATION_TESTS", "false").lower() == "true"


@pytest.fixture(scope="session")
def event_loop():
    """Créer un event loop pour les tests asyncio"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================
# Fixtures pour les tests unitaires (avec mocks)
# ============================================

@pytest.fixture
def mock_auth_dependency():
    """Mock pour la dépendance d'authentification"""
    mock_user = Mock()
    mock_user.id = 1
    mock_user.email = "test@example.com"
    mock_user.role = "ROLE_CANDIDAT"
    return mock_user


@pytest.fixture
async def auth_token() -> str:
    """Token d'authentification mocké pour les tests unitaires"""
    # Pour les tests unitaires, on retourne un token fictif
    # Les vrais tests d'intégration utiliseront les fixtures *_integration
    return "mock-jwt-token-for-testing"


@pytest.fixture
async def company_auth_token() -> str:
    """Token d'authentification entreprise mocké"""
    return "mock-company-jwt-token-for-testing"


@pytest.fixture
async def recruiter_auth_token() -> str:
    """Token d'authentification recruteur mocké"""
    return "mock-recruiter-jwt-token-for-testing"


@pytest.fixture
async def admin_auth_token() -> str:
    """Token d'authentification admin mocké"""
    return "mock-admin-jwt-token-for-testing"


@pytest.fixture
async def service_token() -> str:
    """Token de service pour les appels inter-services"""
    return "mock-service-token"


# ============================================
# Client HTTP pour tests avec ASGITransport
# ============================================

def _get_candidate_app():
    """Obtenir l'app FastAPI du service candidate"""
    services_candidate = project_root / "services" / "candidate"
    candidate_path_str = str(services_candidate)
    if candidate_path_str not in sys.path:
        sys.path.insert(0, candidate_path_str)
    from app.main import app
    return app


def _get_notification_app():
    """Obtenir l'app FastAPI du service notification"""
    services_notification = project_root / "services" / "notification"
    notification_path_str = str(services_notification)
    if notification_path_str not in sys.path:
        sys.path.insert(0, notification_path_str)
    from app.main import app
    return app


def _get_company_app():
    """Obtenir l'app FastAPI du service company"""
    services_company = project_root / "services" / "company"
    company_path_str = str(services_company)
    if company_path_str not in sys.path:
        sys.path.insert(0, company_path_str)
    from app.main import app
    return app


def _get_document_app():
    """Obtenir l'app FastAPI du service document"""
    services_document = project_root / "services" / "document"
    document_path_str = str(services_document)
    if document_path_str not in sys.path:
        sys.path.insert(0, document_path_str)
    from app.main import app
    return app


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """
    Client HTTP pour les tests.

    Pour les tests d'intégration (INTEGRATION_TESTS=true), se connecte aux vrais services.
    Pour les tests unitaires, utilise un client mocké.
    """
    if INTEGRATION_TESTS:
        # Tests d'intégration: se connecter aux vrais services
        async with AsyncClient(base_url="http://localhost:8000", timeout=30.0) as ac:
            yield ac
    else:
        # Tests unitaires: retourner un client mocké
        # Les tests doivent utiliser les fixtures spécifiques par service
        mock_client = AsyncMock(spec=AsyncClient)
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"message": "mocked"}
        mock_client.post.return_value = mock_response
        mock_client.get.return_value = mock_response
        mock_client.patch.return_value = mock_response
        mock_client.delete.return_value = mock_response
        yield mock_client


@pytest.fixture
async def candidate_client() -> AsyncGenerator[AsyncClient, None]:
    """Client HTTP pour tester le service candidate avec ASGITransport"""
    try:
        app = _get_candidate_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    except ImportError as e:
        pytest.skip(f"Cannot import candidate app: {e}")


@pytest.fixture
async def notification_client() -> AsyncGenerator[AsyncClient, None]:
    """Client HTTP pour tester le service notification avec ASGITransport"""
    try:
        app = _get_notification_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    except ImportError as e:
        pytest.skip(f"Cannot import notification app: {e}")


@pytest.fixture
async def company_client() -> AsyncGenerator[AsyncClient, None]:
    """Client HTTP pour tester le service company avec ASGITransport"""
    try:
        app = _get_company_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    except ImportError as e:
        pytest.skip(f"Cannot import company app: {e}")


@pytest.fixture
async def document_client() -> AsyncGenerator[AsyncClient, None]:
    """Client HTTP pour tester le service document avec ASGITransport"""
    try:
        app = _get_document_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    except ImportError as e:
        pytest.skip(f"Cannot import document app: {e}")

# ============================================
# Fixtures mockées pour les tests unitaires
# ============================================

@pytest.fixture
async def profile_id() -> int:
    """ID de profil mocké pour les tests unitaires"""
    return 1


@pytest.fixture
async def complete_profile_id() -> int:
    """ID de profil complet mocké pour les tests unitaires"""
    return 2


@pytest.fixture
async def incomplete_profile_id() -> int:
    """ID de profil incomplet mocké pour les tests unitaires"""
    return 3


@pytest.fixture
async def company_id() -> int:
    """ID d'entreprise mocké pour les tests unitaires"""
    return 1


@pytest.fixture
async def document_id() -> int:
    """ID de document mocké pour les tests unitaires"""
    return 1


@pytest.fixture
async def candidate_id() -> int:
    """ID de candidat mocké pour les tests unitaires"""
    return 1

# ============================================
# Fixtures de mocks pour les tests
# ============================================
from unittest.mock import Mock

@pytest.fixture
def mock_complete_profile():
    """Créer un profil complet mock"""
    # Ajouter le service candidate au PYTHONPATH si nécessaire pour les imports
    services_candidate = project_root / "services" / "candidate"
    if services_candidate.exists():
        candidate_path_str = str(services_candidate)
        if candidate_path_str not in sys.path:
            sys.path.insert(0, candidate_path_str)
    
    # Ne pas importer les modèles SQLModel pour éviter les conflits de métadonnées
    # Utiliser des Mocks simples sans spec
    profile = Mock()
    profile.id = 1
    profile.user_id = 1
    profile.first_name = "John"
    profile.last_name = "Doe"
    profile.email = "john@example.com"
    profile.date_of_birth = "1990-01-01"
    profile.nationality = "Française"
    profile.phone = "+33612345678"
    profile.address = "123 Rue Test"
    profile.city = "Paris"
    profile.country = "France"
    profile.profile_title = "Développeur Fullstack"
    profile.professional_summary = "Expérience en développement web" * 10
    profile.sector = "Technologie"
    profile.main_job = "Développeur"
    profile.total_experience = 5
    profile.accept_cgu = True
    profile.accept_rgpd = True
    profile.accept_verification = True
    profile.status = "DRAFT"
    
    # Expériences
    exp1 = Mock()
    exp1.company_name = "Test Company"
    exp1.position = "Développeur"
    exp1.start_date = "2020-01-01"
    exp1.end_date = "2022-12-31"
    exp1.is_current = False
    exp1.description = "Développement d'applications web avec React et Node.js. Gestion de projets et équipes techniques. " * 5  # Au moins 100 caractères
    profile.experiences = [exp1]
    
    # Formations
    edu1 = Mock()
    edu1.diploma = "Master"
    edu1.institution = "Université"
    edu1.graduation_year = 2015
    edu1.level = "Bac+5"
    profile.educations = [edu1]
    
    # Compétences techniques
    skill1 = Mock()
    skill1.name = "Python"
    skill1.skill_type = "TECHNICAL"
    skill1.level = "ADVANCED"
    profile.skills = [skill1]
    
    profile.job_preferences = Mock()
    profile.job_preferences.contract_type = "CDI"
    profile.job_preferences.desired_location = "Paris"
    profile.job_preferences.availability = "immediate"
    profile.job_preferences.desired_positions = ["Développeur"]  # Liste réelle
    profile.job_preferences.target_sectors = []  # Liste réelle (peut être vide)
    profile.job_preferences.salary_min = 50000
    profile.job_preferences.salary_max = 80000
    
    return profile

@pytest.fixture
def mock_profile_without_consents():
    """Créer un profil sans consentements"""
    profile = Mock()
    profile.id = 1
    profile.user_id = 1
    profile.first_name = "John"
    profile.last_name = "Doe"
    profile.email = "john@example.com"
    profile.date_of_birth = "1990-01-01"
    profile.nationality = "Française"
    profile.phone = "+33612345678"
    profile.address = "123 Rue Test"
    profile.city = "Paris"
    profile.country = "France"
    profile.profile_title = "Développeur Fullstack"
    profile.professional_summary = "Expérience en développement web" * 10
    profile.sector = "Technologie"
    profile.main_job = "Développeur"
    profile.total_experience = 5
    profile.accept_cgu = False  # Pas de consentements
    profile.accept_rgpd = False
    profile.accept_verification = False
    profile.status = "DRAFT"
    
    exp1 = Mock()
    exp1.company_name = "Test Company"
    exp1.position = "Développeur"
    exp1.start_date = "2020-01-01"
    exp1.end_date = "2022-12-31"
    exp1.is_current = False
    exp1.description = "Développement d'applications web avec React et Node.js. Gestion de projets et équipes techniques. " * 5
    profile.experiences = [exp1]
    
    edu1 = Mock()
    edu1.diploma = "Master"
    edu1.institution = "Université"
    edu1.graduation_year = 2015
    edu1.level = "Bac+5"
    profile.educations = [edu1]
    
    skill1 = Mock()
    skill1.name = "Python"
    skill1.skill_type = "TECHNICAL"
    skill1.level = "ADVANCED"
    profile.skills = [skill1]
    
    profile.job_preferences = Mock()
    profile.job_preferences.contract_type = "CDI"
    profile.job_preferences.desired_location = "Paris"
    profile.job_preferences.availability = "immediate"
    profile.job_preferences.desired_positions = ["Développeur"]  # Liste réelle
    profile.job_preferences.target_sectors = []  # Liste réelle (peut être vide)
    profile.job_preferences.salary_min = 50000
    profile.job_preferences.salary_max = 80000
    
    return profile

@pytest.fixture
def mock_profile_without_experiences():
    """Créer un profil sans expériences"""
    profile = Mock()
    profile.id = 1
    profile.user_id = 1
    profile.first_name = "John"
    profile.last_name = "Doe"
    profile.email = "john@example.com"
    profile.date_of_birth = "1990-01-01"
    profile.nationality = "Française"
    profile.phone = "+33612345678"
    profile.address = "123 Rue Test"
    profile.city = "Paris"
    profile.country = "France"
    profile.profile_title = "Développeur Fullstack"
    profile.professional_summary = "Expérience en développement web" * 10
    profile.sector = "Technologie"
    profile.main_job = "Développeur"
    profile.total_experience = 5
    profile.accept_cgu = True
    profile.accept_rgpd = True
    profile.accept_verification = True
    profile.status = "DRAFT"
    
    profile.experiences = []  # Pas d'expériences
    
    edu1 = Mock()
    edu1.diploma = "Master"
    edu1.institution = "Université"
    edu1.graduation_year = 2015
    edu1.level = "Bac+5"
    profile.educations = [edu1]
    
    skill1 = Mock()
    skill1.name = "Python"
    skill1.skill_type = "TECHNICAL"
    skill1.level = "ADVANCED"
    profile.skills = [skill1]
    
    profile.job_preferences = Mock()
    profile.job_preferences.contract_type = "CDI"
    profile.job_preferences.desired_location = "Paris"
    profile.job_preferences.availability = "immediate"
    profile.job_preferences.desired_positions = ["Développeur"]  # Liste réelle
    profile.job_preferences.target_sectors = []  # Liste réelle (peut être vide)
    profile.job_preferences.salary_min = 50000
    profile.job_preferences.salary_max = 80000
    
    return profile

@pytest.fixture
def mock_profile_without_technical_skills():
    """Créer un profil sans compétences techniques"""
    # Ajouter le service candidate au PYTHONPATH si nécessaire
    services_candidate = project_root / "services" / "candidate"
    if services_candidate.exists():
        candidate_path_str = str(services_candidate)
        if candidate_path_str not in sys.path:
            sys.path.insert(0, candidate_path_str)
    
    profile = Mock()
    profile.id = 1
    profile.user_id = 1
    profile.first_name = "John"
    profile.last_name = "Doe"
    profile.email = "john@example.com"
    profile.date_of_birth = "1990-01-01"
    profile.nationality = "Française"
    profile.phone = "+33612345678"
    profile.address = "123 Rue Test"
    profile.city = "Paris"
    profile.country = "France"
    profile.profile_title = "Développeur Fullstack"
    profile.professional_summary = "Expérience en développement web" * 10
    profile.sector = "Technologie"
    profile.main_job = "Développeur"
    profile.total_experience = 5
    profile.accept_cgu = True
    profile.accept_rgpd = True
    profile.accept_verification = True
    profile.status = "DRAFT"
    
    exp1 = Mock()
    exp1.company_name = "Test Company"
    exp1.position = "Développeur"
    exp1.start_date = "2020-01-01"
    exp1.end_date = "2022-12-31"
    exp1.is_current = False
    exp1.description = "Développement d'applications web avec React et Node.js. Gestion de projets et équipes techniques. " * 5
    profile.experiences = [exp1]
    
    edu1 = Mock()
    edu1.diploma = "Master"
    edu1.institution = "Université"
    edu1.graduation_year = 2015
    edu1.level = "Bac+5"
    profile.educations = [edu1]
    
    profile.skills = []  # Pas de compétences techniques
    
    profile.job_preferences = Mock()
    profile.job_preferences.contract_type = "CDI"
    profile.job_preferences.desired_location = "Paris"
    profile.job_preferences.availability = "immediate"
    profile.job_preferences.desired_positions = ["Développeur"]  # Liste réelle
    profile.job_preferences.target_sectors = []  # Liste réelle (peut être vide)
    profile.job_preferences.salary_min = 50000
    profile.job_preferences.salary_max = 80000
    
    return profile
