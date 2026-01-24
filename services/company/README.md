# Company Service

Service de gestion des entreprises et recruteurs pour la plateforme Yemma Solutions.

## 🎯 Vue d'ensemble

Le service company gère :
- Les entreprises inscrites sur la plateforme
- Les recruteurs membres des entreprises
- Le système d'invitation par email
- Les permissions et accès RBAC
- Les informations de contact des référents

## ✨ Fonctionnalités

- ✅ Gestion complète des entreprises (Company)
- ✅ Gestion des membres d'équipe (TeamMember)
- ✅ Système d'invitation par email avec token sécurisé
- ✅ Middleware de permissions RBAC
- ✅ Accès restreint aux candidats validés pour les recruteurs
- ✅ Accès aux factures réservé au compte maître
- ✅ Informations de contact du référent (prénom, nom, email, téléphone, fonction)
- ✅ Soft delete pour la traçabilité

## 📁 Structure

```
services/company/
├── app/
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── api/v1/
│   │   ├── companies.py          # Endpoints entreprises
│   │   ├── recruiters.py         # Endpoints recruteurs (legacy)
│   │   ├── invitations.py        # Endpoints invitations
│   │   └── invoices.py           # Endpoints factures
│   ├── core/
│   │   ├── config.py             # Configuration
│   │   └── exceptions.py          # Gestion des erreurs
│   ├── domain/
│   │   ├── models.py             # Modèles SQLModel
│   │   └── schemas.py            # Schémas Pydantic
│   └── infrastructure/
│       ├── database.py           # Configuration DB
│       ├── auth.py               # Validation JWT
│       ├── permissions.py        # Middleware RBAC
│       ├── invitation.py         # Gestion invitations
│       ├── repositories.py       # Repositories
│       └── notification_client.py # Client notification
├── Dockerfile
├── requirements.txt
└── README.md
```

## 📊 Modèles de données

### Company

Modèle principal représentant une entreprise :

- `id` : ID unique
- `name` : Nom de l'entreprise (requis, max 255 caractères)
- `legal_id` : RCCM/SIRET/ID légal (unique, requis, max 50 caractères)
- `adresse` : Adresse complète (optionnel, max 500 caractères)
- `logo_url` : URL du logo (optionnel, max 500 caractères)
- `admin_id` : ID du compte maître (FK vers users dans auth-service)
- `status` : Statut (active, suspended, inactive)
- `subscription_id` : ID de l'abonnement (FK vers payment-service)
- **Champs de contact du référent** :
  - `contact_first_name` : Prénom du référent (optionnel, max 100 caractères)
  - `contact_last_name` : Nom du référent (optionnel, max 100 caractères)
  - `contact_email` : Email du référent (optionnel, max 255 caractères)
  - `contact_phone` : Téléphone du référent (optionnel, max 50 caractères)
  - `contact_function` : Fonction du référent (optionnel, max 100 caractères)
- `created_at` : Date de création
- `updated_at` : Date de mise à jour
- `deleted_at` : Date de suppression (soft delete)

### TeamMember

Lien entre un utilisateur et une entreprise :

- `id` : ID unique
- `user_id` : ID utilisateur (FK vers users dans auth-service)
- `company_id` : ID de l'entreprise (FK vers companies)
- `role_in_company` : Rôle (ADMIN_ENTREPRISE, RECRUTEUR)
- `status` : Statut (active, inactive, pending)
- `joined_at` : Date d'acceptation de l'invitation
- `created_at` : Date de création
- `updated_at` : Date de mise à jour
- `deleted_at` : Date de suppression (soft delete)

### Invitation

Invitation d'un recruteur à rejoindre une entreprise :

- `id` : ID unique
- `company_id` : ID de l'entreprise (FK vers companies)
- `email` : Email invité (indexé)
- `first_name` : Prénom de l'invité (optionnel, max 100 caractères)
- `last_name` : Nom de l'invité (optionnel, max 100 caractères)
- `token` : Token d'invitation unique (indexé)
- `role` : Rôle assigné (RECRUTEUR par défaut)
- `status` : Statut (pending, accepted, expired, cancelled)
- `expires_at` : Date d'expiration (indexé)
- `invited_by` : ID de l'utilisateur qui a envoyé l'invitation
- `accepted_at` : Date d'acceptation
- `created_at` : Date de création

## 🚀 Endpoints

### Companies

#### POST /api/v1/companies

Crée une nouvelle entreprise.

**Body :**
```json
{
  "name": "Acme Corporation",
  "legal_id": "CI-ABJ-2024-A-12345",
  "adresse": "123 Rue Example, Abidjan",
  "logo_url": "https://...",
  "admin_id": 1,
  "contact_first_name": "Jean",
  "contact_last_name": "Dupont",
  "contact_email": "jean.dupont@acme.com",
  "contact_phone": "+225 07 12 34 56 78",
  "contact_function": "Directeur RH"
}
```

**Permissions** : ROLE_COMPANY_ADMIN ou ROLE_SUPER_ADMIN

#### GET /api/v1/companies/me/company

Récupère l'entreprise de l'utilisateur connecté.

**Permissions** : ROLE_COMPANY_ADMIN ou ROLE_RECRUITER

#### GET /api/v1/companies/{company_id}

Récupère une entreprise par ID.

**Permissions** : Admin de l'entreprise, membre de l'entreprise, ou ROLE_SUPER_ADMIN

#### PUT /api/v1/companies/{company_id}

Met à jour une entreprise.

**Body :**
```json
{
  "name": "Nouveau nom",
  "adresse": "Nouvelle adresse",
  "logo_url": "https://...",
  "contact_first_name": "Jean",
  "contact_last_name": "Dupont",
  "contact_email": "jean.dupont@acme.com",
  "contact_phone": "+225 07 12 34 56 78",
  "contact_function": "Directeur RH"
}
```

**Permissions** : Admin de l'entreprise uniquement

#### GET /api/v1/companies

Liste toutes les entreprises (admin uniquement).

**Permissions** : ROLE_SUPER_ADMIN ou ROLE_ADMIN

### Team Members

#### GET /api/v1/companies/{company_id}/team-members

Récupère tous les membres de l'équipe d'une entreprise, y compris les invitations en attente.

**Réponse :**
```json
[
  {
    "id": 1,
    "type": "member",
    "email": "recruiter@example.com",
    "first_name": "Jane",
    "last_name": "Recruiter",
    "role_in_company": "RECRUTEUR",
    "status": "active",
    "joined_at": "2024-01-15T10:00:00",
    "created_at": "2024-01-15T10:00:00",
    "user_id": 123
  },
  {
    "id": 2,
    "type": "invitation",
    "email": "newrecruiter@example.com",
    "first_name": "John",
    "last_name": "New",
    "role_in_company": "RECRUTEUR",
    "status": "pending",
    "created_at": "2024-01-20T14:00:00",
    "invitation_id": 5,
    "expires_at": "2024-01-27T14:00:00"
  }
]
```

**Permissions** : Admin de l'entreprise ou ROLE_SUPER_ADMIN

#### DELETE /api/v1/companies/{company_id}/team-members/{team_member_id}

Supprime un membre d'équipe (soft delete).

**Permissions** : Admin de l'entreprise uniquement
**Note** : L'administrateur de l'entreprise ne peut pas être supprimé

### Invitations

#### POST /api/v1/invitations/invite

Invite un recruteur à rejoindre l'entreprise.

**Body :**
```json
{
  "email": "recruiter@example.com",
  "first_name": "Jane",
  "last_name": "Recruiter",
  "password": "temporary_password_123"
}
```

**Permissions** : Admin de l'entreprise uniquement

**Comportement :**
1. Crée un compte utilisateur dans auth-service
2. Crée une invitation avec token unique
3. Envoie un email d'invitation (via notification-service)
4. Le recruteur peut accepter l'invitation via le token

#### POST /api/v1/invitations/accept

Accepte une invitation et crée le compte recruteur.

**Body :**
```json
{
  "token": "abc123xyz",
  "password": "new_password_123",
  "first_name": "Jane",
  "last_name": "Recruiter"
}
```

#### GET /api/v1/invitations/validate/{token}

Valide un token d'invitation (vérifie s'il est valide et non expiré).

## 🔐 Permissions RBAC

### Middleware de permissions

1. **require_company_admin** : Vérifie que l'utilisateur est admin de l'entreprise
2. **require_company_master** : Vérifie que l'utilisateur est le compte maître (pour factures)
3. **get_current_company** : Récupère l'entreprise de l'utilisateur connecté

### Règles d'accès

- **Recruteurs (ROLE_RECRUITER)** : 
  - Peuvent voir uniquement les candidats validés
  - Peuvent rechercher dans la CVthèque
  - Ne peuvent pas gérer l'équipe
  - Ne peuvent pas voir les factures

- **Compte Maître (ROLE_COMPANY_ADMIN)** : 
  - Accès complet à l'entreprise
  - Peut gérer l'équipe (inviter, supprimer)
  - Peut voir les factures
  - Peut modifier les informations de l'entreprise

- **Super Admin (ROLE_SUPER_ADMIN)** : 
  - Accès total à toutes les entreprises
  - Peut voir toutes les entreprises
  - Peut gérer toutes les entreprises

## 🔄 Système d'invitation

### Flux d'invitation

1. **Création de l'invitation** :
   - Le compte maître appelle `POST /api/v1/invitations/invite`
   - Un compte utilisateur est créé dans auth-service
   - Un token unique est généré et stocké
   - Un email est envoyé avec le lien d'invitation

2. **Acceptation de l'invitation** :
   - Le recruteur clique sur le lien dans l'email
   - Il est redirigé vers la page d'acceptation avec le token
   - Il remplit ses informations (prénom, nom, mot de passe)
   - Appel à `POST /api/v1/invitations/accept`
   - Un TeamMember est créé et lié à l'entreprise
   - Le statut de l'invitation passe à "accepted"

3. **Expiration** :
   - Les invitations expirent après 7 jours (configurable)
   - Le statut passe automatiquement à "expired"

## ⚙️ Configuration

Variables d'environnement :

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=yemma_company_db

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
AUTH_SERVICE_URL=http://localhost:8001

# Invitation
INVITATION_TOKEN_EXPIRE_DAYS=7
INVITATION_SECRET_KEY=your-invitation-secret

# Services
SEARCH_SERVICE_URL=http://localhost:8004
PAYMENT_SERVICE_URL=http://localhost:8006
NOTIFICATION_SERVICE_URL=http://localhost:8007
FRONTEND_URL=http://localhost:3000
```

## 🛠️ Développement

### Installation locale

```bash
# Installer les dépendances
pip install -r requirements.txt

# Démarrer le service
uvicorn app.main:app --reload --port 8005
```

### Avec Docker

```bash
# Build et démarrage
docker-compose up company-service

# Voir les logs
docker-compose logs -f company-service
```

## 🗄️ Migrations

Le service inclut des migrations automatiques pour :
- Ajouter les champs `first_name` et `last_name` à la table `invitations`
- Ajouter les champs de contact du référent à la table `companies`

Les migrations s'exécutent automatiquement au démarrage du service.

## 📚 Documentation supplémentaire

- [Gestion des membres d'équipe](./README_TEAMMEMBER.md)
- [Système d'invitations](./README_INVITATIONS.md)

## 🧪 Tests

```bash
# Exécuter les tests
pytest

# Avec couverture
pytest --cov=app
```

## 🚀 Prochaines étapes

- [ ] Implémenter l'envoi d'emails pour les invitations (via notification-service)
- [ ] Intégrer avec le service de paiement pour les factures
- [ ] Ajouter la gestion des quotas par recruteur
- [ ] Implémenter les notifications d'invitation
- [ ] Ajouter la gestion des rôles personnalisés
- [ ] Implémenter le transfert d'administration

---

**Service développé pour Yemma Solutions**
