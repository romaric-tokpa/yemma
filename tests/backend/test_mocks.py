"""
Fixtures et mocks pour les tests backend
NOTE: Les fixtures principales ont été déplacées dans conftest.py pour être disponibles partout
Ce fichier peut contenir des fixtures supplémentaires spécifiques si nécessaire
"""
import sys
from pathlib import Path

# Ajouter le répertoire racine au PYTHONPATH
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Ajouter le répertoire du service candidate au PYTHONPATH
services_candidate = project_root / "services" / "candidate"
if services_candidate.exists():
    candidate_path_str = str(services_candidate)
    if candidate_path_str in sys.path:
        sys.path.remove(candidate_path_str)
    sys.path.insert(0, candidate_path_str)

import pytest
from unittest.mock import Mock, AsyncMock

# Les fixtures principales sont maintenant dans conftest.py
# Ce fichier peut contenir des fixtures supplémentaires si nécessaire
# NOTE: Ne pas importer les modèles SQLModel ici pour éviter les conflits de métadonnées SQLAlchemy
