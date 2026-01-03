# Company Service

Service de gestion des entreprises et recruteurs.

## Fonctionnalités

- ✅ Gestion des entreprises (Company)
- ✅ Gestion des recruteurs (Recruiter)
- ✅ Système d'invitation par email avec token
- ✅ Middleware de permissions RBAC
- ✅ Accès restreint aux candidats validés pour les recruteurs
- ✅ Accès aux factures réservé au compte maître

## Structure

```
services/company/
├── app/
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── api/v1/
│   │   ├── companies.py          # Endpoints entreprises
│   │   ├── recruiters.py         # Endpoints recruteurs
│   │   ├── invitations.py        # Endpoints invitations
│   │   └── invoices.py           # Endpoints factures
│   ├── core/
│   │   ├── config.py             # Configuration
│   │   └── exceptions.py         # Gestion des erreurs
│   ├── domain/
│   │   ├── models.py             # Modèles SQLModel
│   │   └── schemas.py            # Schémas Pydantic
│   └── infrastructure/
│       ├── database.py           # Configuration DB
│       ├── auth.py               # Validation JWT
│       ├── permissions.py        # Middleware RBAC
│       ├── invitation.py         # Gestion invitations
│       └── repositories.py       # Repositories
├── Dockerfile
├── requirements.txt
└── README.md
```

## Modèles

### Company
- `id` : ID unique
- `name` : Nom de l'entreprise
- `legal_id` : SIRET/ID légal (unique)
- `logo_url` : URL du logo
- `admin_id` : ID du compte maître (FK vers users)
- `status` : Statut (active, suspended, inactive)
- `subscription_id` : ID de l'abonnement

### Recruiter
- `id` : ID unique
- `user_id` : ID utilisateur (FK vers users)
- `company_id` : ID de l'entreprise (FK vers companies)
- `status` : Statut (active, inactive, pending)
- `joined_at` : Date d'acceptation de l'invitation

### Invitation
- `id` : ID unique
- `company_id` : ID de l'entreprise
- `email` : Email invité
- `token` : Token d'invitation unique
- `status` : Statut (pending, accepted, expired, cancelled)
- `expires_at` : Date d'expiration
- `invited_by` : ID de l'utilisateur qui a envoyé l'invitation

## Endpoints

### Companies

- `POST /api/v1/companies` : Créer une entreprise
- `GET /api/v1/companies/{id}` : Récupérer une entreprise
- `PUT /api/v1/companies/{id}` : Mettre à jour une entreprise
- `GET /api/v1/companies/me/company` : Récupérer mon entreprise

### Recruiters

- `GET /api/v1/recruiters/company/{company_id}` : Liste des recruteurs d'une entreprise
- `GET /api/v1/recruiters/me` : Mon profil recruteur
- `DELETE /api/v1/recruiters/{id}` : Supprimer un recruteur
- `POST /api/v1/recruiters/search/candidates` : Rechercher des candidats validés

### Invitations

- `POST /api/v1/invitations/invite` : Inviter un recruteur
- `GET /api/v1/invitations/company/{company_id}` : Liste des invitations
- `POST /api/v1/invitations/accept` : Accepter une invitation
- `GET /api/v1/invitations/validate/{token}` : Valider un token d'invitation

### Invoices

- `GET /api/v1/company/{company_id}/invoices` : Récupérer les factures (compte maître uniquement)

## Permissions RBAC

### Middleware de permissions

1. **require_company_admin** : Vérifie que l'utilisateur est admin de l'entreprise
2. **require_recruiter_access** : Vérifie que l'utilisateur est recruteur actif
3. **require_company_master** : Vérifie que l'utilisateur est le compte maître (pour factures)

### Règles d'accès

- **Recruteurs** : Peuvent voir uniquement les candidats validés
- **Compte Maître (COMPANY_ADMIN)** : Accès complet + factures
- **Super Admin** : Accès total

## Système d'invitation

1. Le compte maître envoie une invitation via `POST /api/v1/invitations/invite`
2. Un token unique est généré et stocké
3. Un email est envoyé avec le lien d'invitation (à implémenter)
4. Le recruteur accepte l'invitation via `POST /api/v1/invitations/accept`
5. Un compte Recruiter est créé et lié à l'entreprise

## Configuration

Variables d'environnement :

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=yemma_db

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
AUTH_SERVICE_URL=http://localhost:8001

# Invitation
INVITATION_TOKEN_EXPIRE_DAYS=7
INVITATION_SECRET_KEY=your-invitation-secret

# Services
SEARCH_SERVICE_URL=http://localhost:8004
SUBSCRIPTION_SERVICE_URL=http://localhost:8005
```

## Développement

```bash
# Installer les dépendances
pip install -r requirements.txt

# Démarrer le service
uvicorn app.main:app --reload --port 8005
```

## Docker

```bash
# Build et démarrage
docker-compose up company
```

## Prochaines étapes

- [ ] Implémenter l'envoi d'emails pour les invitations
- [ ] Intégrer avec le service de paiement pour les factures
- [ ] Ajouter la gestion des quotas par recruteur
- [ ] Implémenter les notifications d'invitation

