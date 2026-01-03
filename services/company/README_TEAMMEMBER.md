# Service Entreprise - TeamMember

Service de gestion des entreprises avec modèle TeamMember et middleware `get_current_company`.

## Modèles

### Company
- `id`: ID unique
- `name`: Nom de l'entreprise
- `adresse`: Adresse de l'entreprise (nouveau)
- `legal_id`: SIRET/ID légal (unique)
- `logo_url`: URL du logo
- `admin_id`: ID du compte maître (FK vers users)
- `status`: Statut (active, suspended, inactive)
- `subscription_id`: ID de l'abonnement

### TeamMember
- `id`: ID unique
- `user_id`: ID utilisateur (FK vers users, auth-service)
- `company_id`: ID de l'entreprise (FK vers companies)
- `role_in_company`: Rôle dans l'entreprise (ADMIN_ENTREPRISE, RECRUTEUR)
- `status`: Statut (active, inactive, pending)
- `joined_at`: Date d'acceptation de l'invitation

### Invitation
- `id`: ID unique
- `company_id`: ID de l'entreprise
- `email`: Email invité
- `token`: Token d'invitation unique
- `status`: Statut (pending, accepted, expired, cancelled)
- `expires_at`: Date d'expiration (48 heures)
- `invited_by`: ID de l'utilisateur qui a envoyé l'invitation
- `accepted_at`: Date d'acceptation

## Endpoints

### POST /api/v1/invitations/invite

Envoie une invitation à un membre d'équipe.

**Authentification requise**: Oui (admin d'entreprise)

**Body:**
```json
{
  "email": "recruteur@example.com"
}
```

**Comportement:**
1. Vérifie que l'utilisateur est ADMIN_ENTREPRISE
2. Génère un token unique
3. Stocke l'invitation avec expiration de 48h
4. Retourne l'invitation avec le token

**Réponse:**
```json
{
  "id": 1,
  "company_id": 123,
  "email": "recruteur@example.com",
  "token": "unique_token_here",
  "status": "pending",
  "expires_at": "2024-01-03T12:00:00Z",
  "invited_by": 456,
  "created_at": "2024-01-01T12:00:00Z"
}
```

### POST /api/v1/invitations/accept-invite

Accepte une invitation et crée le TeamMember.

**Authentification requise**: Non (token d'invitation suffit)

**Body:**
```json
{
  "token": "unique_token_here"
}
```

**Comportement:**
1. Vérifie que le token est valide et non expiré
2. Vérifie que l'utilisateur existe dans auth-service avec l'email de l'invitation
3. Crée un TeamMember avec rôle RECRUTEUR
4. Marque l'invitation comme acceptée

**Réponse:**
```json
{
  "message": "Invitation accepted successfully",
  "team_member_id": 789,
  "company_id": 123,
  "role": "RECRUTEUR"
}
```

## Middleware

### get_current_company

Dependency qui récupère l'entreprise de l'utilisateur actuel.

**Utilisation:**
```python
from app.infrastructure.company_middleware import get_current_company

@router.get("/my-company")
async def get_my_company(
    company: Company = Depends(get_current_company)
):
    return company
```

**Comportement:**
- Vérifie que l'utilisateur est membre actif d'une entreprise
- Retourne l'entreprise de l'utilisateur
- Lève une exception si l'utilisateur n'est pas membre d'une entreprise

### get_current_team_member

Dependency qui récupère le TeamMember de l'utilisateur actuel.

**Utilisation:**
```python
from app.infrastructure.company_middleware import get_current_team_member

@router.get("/my-profile")
async def get_my_profile(
    team_member: TeamMember = Depends(get_current_team_member)
):
    return team_member
```

### require_company_admin_role

Dependency qui vérifie que l'utilisateur est ADMIN_ENTREPRISE.

**Utilisation:**
```python
from app.infrastructure.company_middleware import require_company_admin_role

@router.post("/invite")
async def invite_member(
    company: Company,
    team_member: TeamMember,
    _ = Depends(require_company_admin_role)
):
    # company et team_member sont automatiquement récupérés
    pass
```

## Sécurité

### Isolation des données

Le middleware `get_current_company` garantit qu'un recruteur ne peut accéder qu'aux données de son entreprise :

```python
@router.get("/candidates")
async def get_company_candidates(
    company: Company = Depends(get_current_company)
):
    # Seuls les candidats de cette entreprise seront retournés
    # L'utilisateur ne peut pas accéder aux données d'autres entreprises
    pass
```

### Rôles

- **ADMIN_ENTREPRISE**: Peut inviter des membres, gérer l'entreprise
- **RECRUTEUR**: Peut rechercher des candidats, voir les profils validés

## Migration depuis Recruiter

Le modèle `Recruiter` a été remplacé par `TeamMember` avec :
- Ajout du champ `role_in_company` (ADMIN_ENTREPRISE, RECRUTEUR)
- Renommage de `RecruiterStatus` en `TeamMemberStatus`
- Mise à jour des repositories et endpoints

## Exemple d'utilisation

### Inviter un recruteur

```bash
curl -X POST http://localhost:8006/api/v1/invitations/invite \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruteur@example.com"
  }'
```

### Accepter une invitation

```bash
curl -X POST http://localhost:8006/api/v1/invitations/accept-invite \
  -H "Content-Type: application/json" \
  -d '{
    "token": "unique_token_here"
  }'
```

### Accéder aux données de l'entreprise

```python
@router.get("/my-company/candidates")
async def get_my_company_candidates(
    company: Company = Depends(get_current_company),
    session: AsyncSession = Depends(get_session)
):
    # Seuls les candidats de cette entreprise seront retournés
    # L'utilisateur ne peut pas accéder aux données d'autres entreprises
    pass
```

