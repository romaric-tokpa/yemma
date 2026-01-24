"""
Tests d'intégration pour le service document

Ces tests nécessitent que les services backend soient en cours d'exécution.
Pour lancer ces tests:
    1. docker-compose up -d
    2. INTEGRATION_TESTS=true pytest tests/backend/test_document_service.py -v
"""
import pytest
import os
from httpx import AsyncClient
from io import BytesIO

# Skip tous les tests si les services ne sont pas démarrés
pytestmark = pytest.mark.skipif(
    os.getenv("INTEGRATION_TESTS", "false").lower() != "true",
    reason="Tests d'intégration désactivés. Lancez avec INTEGRATION_TESTS=true après avoir démarré les services."
)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_upload_document_success(client: AsyncClient, auth_token: str, profile_id: int):
    """Test d'upload d'un document"""
    # Créer un fichier PDF factice
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\ntrailer\n<<\n/Root 1 0 R\n>>\nstartxref\n9\n%%EOF"

    files = {
        "file": ("test_cv.pdf", BytesIO(pdf_content), "application/pdf")
    }
    data = {
        "candidate_id": profile_id,
        "document_type": "CV"
    }

    response = await client.post(
        "/api/v1/documents/upload",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["document_type"] == "CV"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_upload_document_invalid_type(client: AsyncClient, auth_token: str, profile_id: int):
    """Test d'upload d'un document avec un type invalide"""
    # Créer un fichier texte (non autorisé)
    text_content = b"This is a text file"

    files = {
        "file": ("test.txt", BytesIO(text_content), "text/plain")
    }
    data = {
        "candidate_id": profile_id,
        "document_type": "CV"
    }

    response = await client.post(
        "/api/v1/documents/upload",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.asyncio
async def test_upload_document_too_large(client: AsyncClient, auth_token: str, profile_id: int):
    """Test d'upload d'un document trop volumineux (>10MB)"""
    # Créer un fichier PDF de 11MB
    large_content = b"%PDF-1.4\n" + b"x" * (11 * 1024 * 1024)

    files = {
        "file": ("large_cv.pdf", BytesIO(large_content), "application/pdf")
    }
    data = {
        "candidate_id": profile_id,
        "document_type": "CV"
    }

    response = await client.post(
        "/api/v1/documents/upload",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_candidate_documents(client: AsyncClient, auth_token: str, profile_id: int):
    """Test de récupération des documents d'un candidat"""
    response = await client.get(
        f"/api/v1/documents/candidate/{profile_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_document_view_url(client: AsyncClient, auth_token: str, document_id: int):
    """Test de génération d'une URL de visualisation de document"""
    response = await client.get(
        f"/api/v1/documents/view/{document_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "view_url" in data
    assert "expires_at" in data


@pytest.mark.integration
@pytest.mark.asyncio
async def test_delete_document(client: AsyncClient, auth_token: str, document_id: int):
    """Test de suppression d'un document"""
    response = await client.delete(
        f"/api/v1/documents/{document_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
