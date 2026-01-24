# Audit Service

Service de logs et audit pour le respect du RGPD. Enregistre tous les accès des recruteurs aux profils candidats.

## 🎯 Vue d'ensemble

Le service audit garantit la conformité RGPD en enregistrant tous les accès aux données personnelles des candidats. Il permet la traçabilité complète des consultations de profils et répond aux exigences du droit à l'information.

## ✨ Fonctionnalités

- ✅ Enregistrement automatique des accès (Qui, Quand, Quel profil)
- ✅ Conformité RGPD : traçabilité complète des accès
- ✅ Consultation des logs par candidat, recruteur, entreprise
- ✅ Statistiques d'accès détaillées
- ✅ Filtres par date, type d'accès, entreprise
- ✅ Export des données pour les candidats (droit à l'information)
- ✅ Indexation optimisée pour performances élevées

## 📁 Structure

```
services/audit/
├── app/
│   ├── main.py                    # FastAPI app
│   ├── api/v1/
│   │   ├── access_logs.py        # Endpoints logs
│   │   └── health.py              # Health check
│   ├── core/
│   │   ├── config.py             # Configuration
│   │   └── exceptions.py         # Gestion des erreurs
│   ├── domain/
│   │   ├── models.py             # Modèle AccessLog
│   │   └── schemas.py            # Schémas Pydantic
│   └── infrastructure/
│       ├── database.py           # Configuration DB
│       └── repositories.py       # Repositories
├── Dockerfile
├── requirements.txt
└── README.md
```

## 📊 Modèle AccessLog

Enregistre pour chaque accès :

- `id` : ID unique
- `recruiter_id` : ID du recruteur (indexé)
- `recruiter_email` : Email du recruteur
- `recruiter_name` : Nom du recruteur
- `company_id` : ID de l'entreprise (indexé)
- `company_name` : Nom de l'entreprise
- `candidate_id` : ID du candidat (indexé)
- `candidate_email` : Email du candidat
- `candidate_name` : Nom du candidat
- `access_type` : Type d'accès (profile_view, document_view, search, export)
- `accessed_at` : Date et heure d'accès (indexé)
- `ip_address` : Adresse IP
- `user_agent` : User-Agent du navigateur
- `metadata` : Métadonnées JSON (contexte supplémentaire)
- `created_at` : Date de création

## 🚀 Endpoints

### POST /api/v1/audit

Enregistre un accès.

**Body :**
```json
{
  "recruiter_id": 1,
  "recruiter_email": "recruiter@example.com",
  "recruiter_name": "Jane Recruiter",
  "company_id": 1,
  "company_name": "Acme Corp",
  "candidate_id": 123,
  "candidate_email": "candidate@example.com",
  "candidate_name": "John Doe",
  "access_type": "profile_view",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

**Note** : L'IP et User-Agent sont automatiquement récupérés depuis la requête si non fournis.

### GET /api/v1/audit/{log_id}

Récupère un log par ID.

### GET /api/v1/audit

Liste les logs avec filtres.

**Paramètres de requête :**
- `candidate_id` : Filtrer par candidat
- `recruiter_id` : Filtrer par recruteur
- `company_id` : Filtrer par entreprise
- `start_date` : Date de début (ISO format)
- `end_date` : Date de fin (ISO format)
- `access_type` : Type d'accès
- `limit` : Nombre de résultats (défaut: 100, max: 1000)
- `offset` : Offset pour pagination

**Exemples :**
```bash
GET /api/v1/audit?candidate_id=123&limit=100&offset=0
GET /api/v1/audit?recruiter_id=1&limit=100&offset=0
GET /api/v1/audit?company_id=1&limit=100&offset=0
GET /api/v1/audit?start_date=2024-01-01T00:00:00&end_date=2024-12-31T23:59:59
```

### GET /api/v1/audit/candidate/{candidate_id}

Logs d'un candidat (RGPD - droit à l'information).

**Permissions** : Candidat propriétaire ou admin

**Réponse :**
```json
{
  "total": 25,
  "items": [
    {
      "id": 1,
      "recruiter_name": "Jane Recruiter",
      "company_name": "Acme Corp",
      "accessed_at": "2024-01-15T10:30:00Z",
      "access_type": "profile_view"
    }
  ]
}
```

### GET /api/v1/audit/recruiter/{recruiter_id}

Logs d'un recruteur.

**Permissions** : Recruteur propriétaire, admin de son entreprise, ou admin

### GET /api/v1/audit/company/{company_id}

Logs d'une entreprise.

**Permissions** : Admin de l'entreprise ou admin

### GET /api/v1/audit/stats/summary

Statistiques d'accès.

**Paramètres :**
- `start_date` : Date de début (optionnel)
- `end_date` : Date de fin (optionnel)
- `company_id` : Filtrer par entreprise (optionnel)

**Réponse :**
```json
{
  "total_accesses": 1500,
  "unique_recruiters": 25,
  "unique_candidates": 300,
  "accesses_by_date": {
    "2024-01-15": 50,
    "2024-01-16": 75,
    "2024-01-17": 100
  },
  "accesses_by_company": {
    "1": 500,
    "2": 300,
    "3": 200
  },
  "accesses_by_type": {
    "profile_view": 1200,
    "document_view": 250,
    "search": 50
  }
}
```

## 🔒 Conformité RGPD

### Droit à l'information (Article 15)

Les candidats peuvent consulter qui a accédé à leur profil via :
```http
GET /api/v1/audit/candidate/{candidate_id}
```

Cela permet aux candidats de savoir :
- Qui a consulté leur profil
- Quand leur profil a été consulté
- Par quelle entreprise

### Droit à l'effacement (Article 17)

Pour supprimer les logs d'un candidat (selon la politique de rétention) :
- Les logs peuvent être anonymisés après une période de rétention
- Conserver les logs nécessaires pour la comptabilité légale
- Implémenter une politique de rétention claire

### Traçabilité

Tous les accès sont enregistrés avec :
- Identité complète du recruteur (ID, email, nom)
- Identité de l'entreprise
- Date et heure précise
- Contexte (IP, User-Agent)
- Type d'accès

## 📋 Types d'accès

- `profile_view` : Consultation d'un profil complet
- `document_view` : Consultation d'un document (CV, diplôme, etc.)
- `search` : Recherche de candidats (peut être agrégé)
- `export` : Export de données (si implémenté)

## 🔗 Intégration avec les autres services

### Company Service

Lorsqu'un recruteur consulte un profil candidat :

```python
# Dans company service, après avoir vérifié le quota
import httpx

async with httpx.AsyncClient() as client:
    await client.post(
        f"{AUDIT_SERVICE_URL}/api/v1/audit",
        json={
            "recruiter_id": current_user.id,
            "recruiter_email": current_user.email,
            "recruiter_name": f"{current_user.first_name} {current_user.last_name}",
            "company_id": company.id,
            "company_name": company.name,
            "candidate_id": candidate.id,
            "candidate_email": candidate.email,
            "candidate_name": f"{candidate.first_name} {candidate.last_name}",
            "access_type": "profile_view"
        }
    )
```

### Candidate Service

Permettre aux candidats de consulter leurs logs :

```python
# Dans candidate service
async with httpx.AsyncClient() as client:
    response = await client.get(
        f"{AUDIT_SERVICE_URL}/api/v1/audit/candidate/{candidate_id}",
        params={"limit": 100}
    )
    access_logs = response.json()
```

## ⚙️ Configuration

Variables d'environnement :

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=yemma_audit_db

# JWT (pour validation des appels)
JWT_SECRET_KEY=your-secret-key
AUTH_SERVICE_URL=http://localhost:8001

# Port
AUDIT_PORT=8008
```

## 🛠️ Développement

### Installation locale

```bash
# Installer les dépendances
pip install -r requirements.txt

# Démarrer le service
uvicorn app.main:app --reload --port 8008
```

### Avec Docker

```bash
# Build et démarrage
docker-compose up audit-service

# Voir les logs
docker-compose logs -f audit-service
```

## 📊 Politique de rétention

**Recommandation** : Conserver les logs pendant 2 ans minimum pour :
- Conformité RGPD
- Audit et sécurité
- Statistiques et analytics
- Résolution de litiges

Au-delà, les logs peuvent être :
- **Anonymisés** : Suppression des emails/noms, conservation des IDs
- **Archivés** : Déplacement vers un stockage froid
- **Supprimés** : Selon la politique de l'entreprise (après période légale)

## 🔐 Sécurité

- ✅ Les logs sont enregistrés automatiquement (pas de modification possible)
- ✅ Seuls les admins peuvent consulter tous les logs
- ✅ Les candidats peuvent consulter uniquement leurs propres logs
- ✅ Les recruteurs peuvent consulter uniquement leurs propres logs
- ✅ Les entreprises peuvent consulter uniquement les logs de leurs recruteurs
- ✅ Validation JWT pour tous les endpoints

## 📈 Performance

Le service est optimisé pour gérer un grand volume de logs :
- **Indexation** : Index sur `candidate_id`, `recruiter_id`, `company_id`, `accessed_at`
- **Pagination** : Limite de 1000 résultats par requête
- **Agrégations** : Calculées à la volée (peuvent être optimisées avec un cache)

## 🧪 Tests

```bash
# Exécuter les tests
pytest

# Avec couverture
pytest --cov=app
```

## 📚 Documentation supplémentaire

- [RGPD et candidats](./README_RGPD_CANDIDATE.md)

## 🚀 Prochaines étapes

- [ ] Implémenter l'anonymisation automatique après période de rétention
- [ ] Ajouter l'export CSV/PDF des logs
- [ ] Implémenter les alertes pour accès suspects
- [ ] Ajouter les statistiques en temps réel
- [ ] Implémenter le cache pour les statistiques fréquentes
- [ ] Ajouter la compression des logs anciens

---

**Service développé pour Yemma Solutions**
