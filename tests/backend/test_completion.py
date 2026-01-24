"""
Tests unitaires pour le module completion (validation de profil)
"""
import sys
from pathlib import Path

# Ajouter le répertoire racine au PYTHONPATH
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Vider le cache des modules AVANT de modifier le PYTHONPATH
# pour forcer le rechargement avec le bon PYTHONPATH
modules_to_remove = [
    'app',
    'app.core',
    'app.core.completion',
    'app.domain',
    'app.domain.models',
    'services.candidate.app',
    'services.candidate.app.core',
    'services.candidate.app.core.completion',
]
# Vider tous les modules qui commencent par 'app.' ou 'services.candidate.app.'
for module_name in list(sys.modules.keys()):
    if module_name.startswith('app.') or module_name.startswith('services.candidate.app.'):
        del sys.modules[module_name]

# Retirer tous les autres services du PYTHONPATH
services_to_remove = [
    str(project_root / "services" / "candidate"),
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

# Ajouter le répertoire du service candidate au PYTHONPATH EN PREMIER
services_candidate = project_root / "services" / "candidate"
if services_candidate.exists():
    candidate_path_str = str(services_candidate)
    sys.path.insert(0, candidate_path_str)

import pytest
from services.candidate.app.core.completion import (
    can_submit_profile,
    calculate_completion_percentage,
    check_cv_exists
)

@pytest.mark.unit
def test_can_submit_profile_complete(mock_complete_profile):
    """Test de validation d'un profil complet"""
    has_cv = True
    can_submit, reason = can_submit_profile(mock_complete_profile, has_cv=has_cv)
    
    assert can_submit is True
    assert "peut être soumis" in reason.lower()

@pytest.mark.unit
def test_can_submit_profile_no_cv(mock_complete_profile):
    """Test de validation d'un profil sans CV"""
    has_cv = False
    can_submit, reason = can_submit_profile(mock_complete_profile, has_cv=has_cv)
    
    assert can_submit is False
    assert "cv" in reason.lower()

@pytest.mark.unit
def test_can_submit_profile_no_consents(mock_profile_without_consents):
    """Test de validation d'un profil sans consentements"""
    has_cv = True
    can_submit, reason = can_submit_profile(mock_profile_without_consents, has_cv=has_cv)
    
    assert can_submit is False
    assert "consentement" in reason.lower()

@pytest.mark.unit
def test_can_submit_profile_no_experiences(mock_profile_without_experiences):
    """Test de validation d'un profil sans expériences"""
    has_cv = True
    can_submit, reason = can_submit_profile(mock_profile_without_experiences, has_cv=has_cv)
    
    assert can_submit is False
    assert "expérience" in reason.lower()

@pytest.mark.unit
def test_can_submit_profile_no_technical_skills(mock_profile_without_technical_skills):
    """Test de validation d'un profil sans compétences techniques"""
    has_cv = True
    can_submit, reason = can_submit_profile(mock_profile_without_technical_skills, has_cv=has_cv)
    
    assert can_submit is False
    assert "compétence technique" in reason.lower()

@pytest.mark.unit
def test_calculate_completion_percentage(mock_complete_profile):
    """Test de calcul du pourcentage de complétion"""
    has_cv = True
    percentage = calculate_completion_percentage(mock_complete_profile, has_cv=has_cv)
    
    assert 0 <= percentage <= 100
    assert percentage >= 80  # Un profil complet doit être >= 80%
