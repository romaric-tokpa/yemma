# Authentification Inter-Services

## Vue d'ensemble

Le système d'authentification inter-services utilise des **tokens JWT partagés** pour sécuriser les communications entre microservices. Chaque appel inter-service doit inclure un token de service dans les headers HTTP.

## Architecture

### Module Partagé

Le module `services/shared/internal_auth.py` contient les fonctions pour :
- **Générer** des tokens de service (`generate_service_token`)
- **Vérifier** des tokens de service (`verify_service_token`)
- **Obtenir** les headers HTTP avec le token (`get_service_token_header`)

### Secret Partagé

Tous les services doivent partager le même secret `INTERNAL_SERVICE_TOKEN_SECRET` (défini dans `env.example`).

⚠️ **IMPORTANT** : Ce secret doit être identique dans tous les services et changé en production !

## Utilisation

### 1. Générer un token pour un appel inter-service

```python
from services.shared.internal_auth import get_service_token_header

# Générer les headers avec le token
headers = get_service_token_header("admin-service")

# Utiliser dans un appel HTTP
async with httpx.AsyncClient() as client:
    response = await client.get(
        f"{settings.CANDIDATE_SERVICE_URL}/api/v1/profiles/{candidate_id}",
        headers=headers
    )
```

### 2. Protéger un endpoint interne

```python
from app.infrastructure.internal_auth import verify_internal_token

@router.post("/internal/endpoint")
async def internal_endpoint(
    service_info: dict = Depends(verify_internal_token)
):
    service_name = service_info["service"]
    # ... logique de l'endpoint
```

### 3. Endpoint acceptant les deux types d'authentification

Pour un endpoint qui accepte soit un token utilisateur, soit un token de service :

```python
@router.get("/{profile_id}")
async def get_profile(
    profile_id: int,
    service_info: Optional[dict] = Depends(verify_internal_token),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    # Si c'est un appel inter-service, service_info sera présent
    if service_info:
        # Autoriser l'accès
        pass
    elif current_user:
        # Vérifier les permissions utilisateur
        if profile.user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    else:
        raise HTTPException(status_code=401, detail="Authentication required")
```

## Headers Requis

Les appels inter-services doivent inclure :

- **X-Service-Token** : Token JWT signé avec le secret partagé
- **X-Service-Name** : Nom du service qui fait l'appel (optionnel mais recommandé)

## Exemples d'Implémentation

### Admin Service → Candidate Service

```python
# services/admin/app/infrastructure/candidate_client.py
from services.shared.internal_auth import get_service_token_header

async def get_candidate_profile(candidate_id: int):
    headers = get_service_token_header("admin-service")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.CANDIDATE_SERVICE_URL}/api/v1/profiles/{candidate_id}",
            headers=headers
        )
        return response.json()
```

### Search Service → Payment Service

```python
# services/search/app/infrastructure/quota_middleware.py
from services.shared.internal_auth import get_service_token_header

async def check_quota(company_id: int):
    headers = get_service_token_header("search-service")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.PAYMENT_SERVICE_URL}/api/v1/quotas/check",
            json={"company_id": company_id},
            headers=headers
        )
        return response.json()
```

## Endpoints Protégés

Les endpoints suivants sont protégés avec `verify_internal_token` :

### Search Service
- `POST /api/v1/candidates/index` - Indexer un candidat
- `POST /api/v1/candidates/index/bulk` - Indexation en masse
- `DELETE /api/v1/candidates/index/{candidate_id}` - Supprimer de l'index

### Candidate Service
- `GET /api/v1/profiles/{profile_id}` - Récupérer un profil (accepte aussi token utilisateur)
- `PUT /api/v1/profiles/{profile_id}` - Mettre à jour un profil (accepte aussi token utilisateur)

## Configuration

### Variable d'environnement

Ajouter dans tous les services :

```bash
INTERNAL_SERVICE_TOKEN_SECRET=yemma-internal-service-secret-key-change-in-production-min-64-chars
```

### Générer un secret sécurisé

```bash
openssl rand -hex 64
```

## Sécurité

1. **Secret Partagé** : Le secret doit être identique dans tous les services
2. **Expiration** : Les tokens expirent après 24 heures
3. **Validation** : Chaque service valide le token avant de traiter la requête
4. **Isolation** : Les tokens de service ne peuvent pas être utilisés pour l'authentification utilisateur

## Dépannage

### Erreur "Missing X-Service-Token header"

Vérifier que les headers sont bien inclus dans l'appel HTTP.

### Erreur "Invalid or expired service token"

- Vérifier que `INTERNAL_SERVICE_TOKEN_SECRET` est identique dans tous les services
- Vérifier que le token n'a pas expiré (24h)

### Erreur "Service name mismatch"

Vérifier que le header `X-Service-Name` correspond au nom du service dans le token.

