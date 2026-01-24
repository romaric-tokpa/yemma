# Candidate Service

Service de gestion des profils candidats pour la plateforme Yemma Solutions.

## 🎯 Vue d'ensemble

Le service candidate gère l'ensemble du cycle de vie des profils candidats :
- Création et édition de profils
- Processus d'onboarding en plusieurs étapes
- Gestion des documents
- Suivi du statut de validation
- Calcul du pourcentage de complétion

## ✨ Fonctionnalités

- ✅ Création de profil en plusieurs étapes (onboarding)
- ✅ Gestion des informations personnelles et professionnelles
- ✅ Gestion des expériences professionnelles
- ✅ Gestion des formations et diplômes
- ✅ Gestion des compétences techniques
- ✅ Gestion des langues
- ✅ Gestion des positions désirées
- ✅ Upload de photo de profil
- ✅ Calcul automatique du pourcentage de complétion
- ✅ Suivi du statut (DRAFT, SUBMITTED, IN_REVIEW, VALIDATED, REJECTED, ARCHIVED)
- ✅ Soft delete pour la traçabilité

## 📁 Structure

```
services/candidate/
├── app/
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── api/v1/
│   │   └── profiles.py           # Endpoints profils
│   ├── core/
│   │   ├── config.py             # Configuration
│   │   ├── exceptions.py         # Gestion des erreurs
│   │   └── completion.py         # Calcul de complétion
│   ├── domain/
│   │   ├── models.py             # Modèles SQLModel
│   │   ├── schemas.py            # Schémas Pydantic
│   │   └── onboarding_schemas.py # Schémas onboarding
│   └── infrastructure/
│       ├── database.py           # Configuration DB
│       ├── auth.py               # Validation JWT
│       ├── repositories.py       # Repositories
│       └── validators.py         # Validateurs métier
├── Dockerfile
├── requirements.txt
└── README.md
```

## 📊 Modèle de données

### Profile

Modèle principal représentant un profil candidat :

- `id` : ID unique
- `user_id` : ID utilisateur (FK vers users dans auth-service)
- `status` : Statut (DRAFT, SUBMITTED, IN_REVIEW, VALIDATED, REJECTED, ARCHIVED)
- `completion_percentage` : Pourcentage de complétion (0-100)
- `last_step_completed` : Dernière étape complétée
- `step0` : Consentements (CGU, RGPD, vérification)
- `step1` : Informations personnelles et professionnelles
- `step2` : Expériences professionnelles
- `step3` : Formations et diplômes
- `step4` : Compétences techniques
- `step5` : Compétences techniques détaillées
- `step6` : Langues
- `step7` : Positions désirées et disponibilité
- `step8` : Documents
- `admin_score` : Score d'évaluation admin (0-5)
- `admin_report` : Rapport d'évaluation complet
- `submitted_at` : Date de soumission
- `validated_at` : Date de validation
- `rejected_at` : Date de rejet
- `created_at` : Date de création
- `updated_at` : Date de mise à jour
- `deleted_at` : Date de suppression (soft delete)

## 🚀 Endpoints

### GET /api/v1/profiles/me

Récupère le profil de l'utilisateur connecté.

**Permissions** : ROLE_CANDIDAT

**Réponse :**
```json
{
  "id": 123,
  "user_id": 456,
  "status": "SUBMITTED",
  "completion_percentage": 85,
  "last_step_completed": 7,
  "step1": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "profileTitle": "Développeur Full Stack",
    "professionalSummary": "...",
    "sector": "IT & Digital",
    "mainJob": "Développeur",
    "totalExperience": 5
  },
  "step2": {
    "experiences": [...]
  },
  "admin_score": null,
  "submitted_at": "2024-01-15T10:00:00",
  "created_at": "2024-01-10T08:00:00"
}
```

### PATCH /api/v1/profiles/me

Met à jour le profil de l'utilisateur connecté (mise à jour partielle).

**Body :**
```json
{
  "step1": {
    "profileTitle": "Nouveau titre",
    "professionalSummary": "Nouveau résumé"
  },
  "last_step_completed": 2
}
```

**Permissions** : ROLE_CANDIDAT

### POST /api/v1/profiles/{profile_id}/submit

Soumet le profil pour validation.

**Permissions** : ROLE_CANDIDAT (propriétaire du profil)

**Comportement :**
- Met à jour le statut à `SUBMITTED`
- Enregistre la date de soumission
- Le profil devient visible pour les administrateurs

### GET /api/v1/profiles/stats

Récupère les statistiques des profils (admin uniquement).

**Réponse :**
```json
{
  "DRAFT": 10,
  "SUBMITTED": 25,
  "IN_REVIEW": 5,
  "VALIDATED": 150,
  "REJECTED": 20,
  "ARCHIVED": 5
}
```

**Permissions** : ROLE_ADMIN ou ROLE_SUPER_ADMIN

### GET /api/v1/profiles

Liste les profils avec filtres (admin uniquement).

**Paramètres de requête :**
- `status` : Filtrer par statut
- `page` : Numéro de page (défaut: 1)
- `size` : Taille de la page (défaut: 20)

**Permissions** : ROLE_ADMIN ou ROLE_SUPER_ADMIN

## 📝 Processus d'onboarding

Le profil candidat est créé en plusieurs étapes :

### Step 0 : Consentements
- Acceptation des CGU
- Acceptation du RGPD
- Acceptation de la vérification

### Step 1 : Informations personnelles
- Prénom, nom, date de naissance, nationalité
- Email, téléphone, adresse
- Titre du profil, résumé professionnel
- Secteur, métier principal, expérience totale
- Photo de profil

### Step 2 : Expériences professionnelles
- Liste des expériences avec :
  - Nom de l'entreprise, logo
  - Poste occupé
  - Dates (début, fin, en cours)
  - Description et réalisations
  - Documents associés

### Step 3 : Formations
- Liste des formations avec :
  - Diplôme, établissement
  - Niveau, pays
  - Années (début, obtention)

### Step 4 : Compétences techniques (basique)
- Liste simple de compétences

### Step 5 : Compétences techniques (détaillées)
- Compétences avec :
  - Nom, niveau (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)
  - Années de pratique

### Step 6 : Langues
- Langues avec niveaux (notions, courant, professionnel, natif)

### Step 7 : Positions désirées
- Types de contrat souhaités
- Localisation souhaitée
- Disponibilité
- Prétentions salariales

### Step 8 : Documents
- Upload de CV et autres documents

## 🧮 Calcul de complétion

Le pourcentage de complétion est calculé automatiquement selon :
- Step 0 : 5%
- Step 1 : 30%
- Step 2 : 25%
- Step 3 : 15%
- Step 4 : 5%
- Step 5 : 10%
- Step 6 : 5%
- Step 7 : 5%

Le calcul prend en compte :
- La présence des champs obligatoires
- Le nombre d'éléments (expériences, formations, compétences)
- La qualité des données (résumé professionnel, descriptions)

## ⚙️ Configuration

Variables d'environnement :

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=yemma_candidate_db

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
AUTH_SERVICE_URL=http://localhost:8001

# Services
DOCUMENT_SERVICE_URL=http://localhost:8003
ADMIN_SERVICE_URL=http://localhost:8009
SEARCH_SERVICE_URL=http://localhost:8004
FRONTEND_URL=http://localhost:3000
```

## 🛠️ Développement

### Installation locale

```bash
# Installer les dépendances
pip install -r requirements.txt

# Démarrer le service
uvicorn app.main:app --reload --port 8002
```

### Avec Docker

```bash
# Build et démarrage
docker-compose up candidate-service

# Voir les logs
docker-compose logs -f candidate-service
```

## 🔄 Intégration avec autres services

### Document Service
- Upload de photo de profil
- Upload de documents (CV, diplômes, etc.)
- Récupération des URLs de documents

### Admin Service
- Notification lors de la soumission d'un profil
- Mise à jour du statut après validation/rejet
- Récupération du score admin

### Search Service
- Indexation automatique après validation
- Suppression de l'index après rejet/archivage

## 📚 Documentation supplémentaire

- [Migration des données](./README_MIGRATION.md)

## 🧪 Tests

```bash
# Exécuter les tests
pytest

# Avec couverture
pytest --cov=app
```

## 🚀 Prochaines étapes

- [ ] Ajouter la validation des données en temps réel
- [ ] Implémenter les suggestions automatiques
- [ ] Ajouter la gestion des versions de profil
- [ ] Implémenter l'export PDF du profil
- [ ] Ajouter la gestion des recommandations

---

**Service développé pour Yemma Solutions**
