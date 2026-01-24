"""
Tests d'intégration pour les repositories (PostgreSQL).
Nécessite : rôle test_user, DB test_yemma_db, voir tests/backend/SETUP_REPOSITORIES_TESTS.md.

Pour lancer ces tests:
    1. Configurer une base de données PostgreSQL de test
    2. INTEGRATION_TESTS=true pytest tests/backend/test_repositories.py -v
"""
import sys
import os
from pathlib import Path

import time
import pytest
from faker import Faker

fake = Faker("fr_FR")

# Skip tous les tests si les services ne sont pas démarrés
pytestmark = pytest.mark.skipif(
    os.getenv("INTEGRATION_TESTS", "false").lower() != "true",
    reason="Tests d'intégration désactivés. Lancez avec INTEGRATION_TESTS=true après avoir configuré la base de données."
)

project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Un seul chemin d'import : services/candidate (comme app.domain.models)
services_candidate = project_root / "services" / "candidate"
if services_candidate.exists():
    candidate_path_str = str(services_candidate)
    for p in [str(project_root / "services" / s) for s in ("document", "auth-service", "company", "search", "notification", "admin")]:
        if p in sys.path:
            sys.path.remove(p)
    if candidate_path_str in sys.path:
        sys.path.remove(candidate_path_str)
    sys.path.insert(0, candidate_path_str)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel

# Base user_id différente à chaque run (timestamp) pour éviter collisions avec runs précédents.
_UNIQUE_USER_ID_BASE = 100_000 + (int(time.time_ns() / 1000) % 900_000)
_unique_user_id_counter = 0


@pytest.fixture
def unique_user_id():
    """Fournit un user_id unique par test pour éviter les conflits en base."""
    global _unique_user_id_counter
    _unique_user_id_counter += 1
    return _UNIQUE_USER_ID_BASE + _unique_user_id_counter


@pytest.fixture(scope="module", autouse=True)
async def ensure_candidate_tables(test_db_engine):
    """Créer les tables candidate une fois pour tous les tests du module."""
    # S'assurer que le PYTHONPATH est correct pour ce module (services/candidate)
    import sys
    from pathlib import Path
    
    project_root = Path(__file__).parent.parent.parent
    services_candidate = project_root / "services" / "candidate"
    
    # Retirer TOUS les autres services du PYTHONPATH
    services_to_remove = [
        str(project_root / "services" / "document"),
        str(project_root / "services" / "auth-service"),
        str(project_root / "services" / "company"),
        str(project_root / "services" / "search"),
        str(project_root / "services" / "notification"),
        str(project_root / "services" / "admin"),
    ]
    for service_path in list(sys.path):
        if service_path in services_to_remove:
            sys.path.remove(service_path)
    
    if services_candidate.exists():
        candidate_path_str = str(services_candidate)
        # Nettoyer les modules app.* pour forcer le rechargement
        for name in list(sys.modules.keys()):
            if (name.startswith("app.") or 
                name.startswith("services.candidate.app.") or
                name.startswith("services.document.app.")):
                try:
                    del sys.modules[name]
                except (KeyError, AttributeError):
                    pass
        # S'assurer que services/candidate est en premier
        if candidate_path_str in sys.path:
            sys.path.remove(candidate_path_str)
        sys.path.insert(0, candidate_path_str)
    
    from app.domain.models import (
        Profile,
        Experience,
        Education,
        Certification,
        Skill,
        JobPreference,
    )

    async with test_db_engine.begin() as conn:
        await conn.run_sync(lambda c: SQLModel.metadata.create_all(bind=c))


@pytest.mark.integration
@pytest.mark.asyncio
async def test_profile_repository_create(test_db_session: AsyncSession, unique_user_id: int):
    """Test de création d'un profil via le repository"""
    from app.infrastructure.repositories import ProfileRepository
    from app.domain.models import Profile, ProfileStatus

    profile_data = {
        "user_id": unique_user_id,
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "email": fake.email(),
        "status": ProfileStatus.DRAFT,
    }

    profile = await ProfileRepository.create(test_db_session, profile_data)

    assert profile.id is not None
    assert profile.first_name == profile_data["first_name"]
    assert profile.status == ProfileStatus.DRAFT


@pytest.mark.integration
@pytest.mark.asyncio
async def test_profile_repository_get_by_user_id(test_db_session: AsyncSession, unique_user_id: int):
    """Test de récupération d'un profil par user_id"""
    from app.infrastructure.repositories import ProfileRepository

    profile_data = {
        "user_id": unique_user_id,
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "email": fake.email(),
    }
    created_profile = await ProfileRepository.create(test_db_session, profile_data)

    profile = await ProfileRepository.get_by_user_id(test_db_session, unique_user_id)

    assert profile is not None
    assert profile.id == created_profile.id
    assert profile.user_id == unique_user_id


@pytest.mark.integration
@pytest.mark.asyncio
async def test_skill_repository_create_technical(test_db_session: AsyncSession, unique_user_id: int):
    """Test de création d'une compétence technique"""
    from app.infrastructure.repositories import ProfileRepository
    from app.domain.models import Profile, Skill, SkillType, SkillLevel

    profile_data = {
        "user_id": unique_user_id,
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "email": fake.email(),
    }
    profile = await ProfileRepository.create(test_db_session, profile_data)

    skill = Skill(
        profile_id=profile.id,
        name="Python",
        skill_type=SkillType.TECHNICAL,
        level=SkillLevel.ADVANCED,
        years_of_practice=5,
    )

    test_db_session.add(skill)
    await test_db_session.commit()
    await test_db_session.refresh(skill)

    assert skill.id is not None
    assert skill.skill_type == SkillType.TECHNICAL
    assert skill.level == SkillLevel.ADVANCED


@pytest.mark.integration
@pytest.mark.asyncio
async def test_skill_repository_create_soft(test_db_session: AsyncSession, unique_user_id: int):
    """Test de création d'une compétence comportementale via le repository"""
    from app.infrastructure.repositories import ProfileRepository, SkillRepository
    from app.domain.models import Profile, Skill, SkillType

    profile_data = {
        "user_id": unique_user_id,
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "email": fake.email(),
    }
    profile = await ProfileRepository.create(test_db_session, profile_data)

    skill_data = {
        "profile_id": profile.id,
        "name": "Communication",
        "skill_type": SkillType.SOFT,
    }

    skill = await SkillRepository.create(test_db_session, skill_data)

    assert skill.id is not None
    assert skill.skill_type == SkillType.SOFT
    assert skill.level is None
