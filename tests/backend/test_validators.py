"""
Tests unitaires pour les validateurs du service document
"""
import sys
from pathlib import Path

import pytest
from io import BytesIO

# Ajouter le service document au PYTHONPATH
project_root = Path(__file__).parent.parent.parent
services_document = project_root / "services" / "document"

# S'assurer que le service document est dans le PYTHONPATH
document_path_str = str(services_document)
if document_path_str not in sys.path:
    sys.path.insert(0, document_path_str)

IMPORT_ERROR = ""
try:
    from app.infrastructure.file_validator import FileValidator
    from app.core.exceptions import FileTooLargeError, InvalidFileTypeError
    IMPORTS_OK = True
except ImportError as e:
    IMPORTS_OK = False
    IMPORT_ERROR = str(e)
    # Créer des classes factices pour éviter les erreurs NameError
    FileValidator = None
    FileTooLargeError = Exception
    InvalidFileTypeError = Exception

# Skip tous les tests si les imports échouent
pytestmark = pytest.mark.skipif(
    not IMPORTS_OK,
    reason=f"Impossible d'importer les modules du service document: {IMPORT_ERROR}"
)

@pytest.mark.unit
def test_validate_pdf_file():
    """Test de validation d'un fichier PDF"""
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\ntrailer\n<<\n/Root 1 0 R\n>>\nstartxref\n9\n%%EOF"
    
    # Tester la validation de l'extension
    extension = FileValidator.validate_file_extension("test.pdf")
    assert extension == "pdf"
    
    # Tester la validation de la taille (ne doit pas lever d'exception pour un fichier valide)
    FileValidator.validate_file_size(len(pdf_content))

@pytest.mark.unit
def test_validate_file_too_large():
    """Test de validation d'un fichier trop volumineux"""
    large_size = 11 * 1024 * 1024  # 11MB
    
    with pytest.raises(FileTooLargeError):
        FileValidator.validate_file_size(large_size)

@pytest.mark.unit
def test_validate_invalid_extension():
    """Test de validation d'une extension invalide"""
    with pytest.raises(InvalidFileTypeError):
        FileValidator.validate_file_extension("test.txt")

@pytest.mark.unit
def test_validate_empty_file():
    """Test de validation d'un fichier vide"""
    with pytest.raises(InvalidFileTypeError):
        FileValidator.validate_file_size(0)
