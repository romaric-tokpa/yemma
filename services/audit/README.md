# Audit Service

Service de logs et audit pour le respect du RGPD. Enregistre tous les accès des recruteurs aux profils candidats.

## Fonctionnalités

- ✅ Enregistrement automatique des accès (Qui, Quand, Quel profil)
- ✅ Conformité RGPD : traçabilité complète des accès
- ✅ Consultation des logs par candidat, recruteur, entreprise
- ✅ Statistiques d'accès
- ✅ Filtres par date, type d'accès
- ✅ Export des données pour les candidats (droit à l'information)

## Architecture

```
services/audit/
├── app/
│   ├── main.py                    # FastAPI app
│   ├── api/v1/
│   │   ├── access_logs.py        # Endpoints logs
│   │   └── health.py             # Health check
│   ├── core/
│   │   ├── config.py             # Configuration
│   │   └── exceptions.py        # Gestion des erreurs
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

## Modèle AccessLog

Enregistre pour chaque accès :
- **Qui** : Recruteur (ID, email, nom), Entreprise (ID, nom)
- **Quand** : Date et heure d'accès
- **Quel profil** : Candidat (ID, email, nom)
- **Contexte** : Type d'accès, IP, User-Agent, métadonnées

## Endpoints

### Enregistrer un accès
```http
POST /api/v1/audit
Content-Type: application/json

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

### Récupérer un log par ID
```http
GET /api/v1/audit/{log_id}
```

### Lister les logs (avec filtres)
```http
GET /api/v1/audit?candidate_id=123&limit=100&offset=0
GET /api/v1/audit?recruiter_id=1&limit=100&offset=0
GET /api/v1/audit?company_id=1&limit=100&offset=0
GET /api/v1/audit?start_date=2024-01-01T00:00:00&end_date=2024-12-31T23:59:59
```

### Logs d'un candidat (RGPD)
```http
GET /api/v1/audit/candidate/{candidate_id}?limit=100&offset=0
```

Permet à un candidat de voir qui a consulté son profil (droit à l'information RGPD).

### Logs d'un recruteur
```http
GET /api/v1/audit/recruiter/{recruiter_id}?limit=100&offset=0
```

### Logs d'une entreprise
```http
GET /api/v1/audit/company/{company_id}?limit=100&offset=0
```

### Statistiques d'accès
```http
GET /api/v1/audit/stats/summary?start_date=2024-01-01&end_date=2024-12-31
```

Retourne :
- Total d'accès
- Nombre de recruteurs uniques
- Nombre de candidats uniques
- Accès par date
- Accès par entreprise

## Conformité RGPD

### Droit à l'information (Article 15)
Les candidats peuvent consulter qui a accédé à leur profil via :
```http
GET /api/v1/audit/candidate/{candidate_id}
```

### Droit à l'effacement (Article 17)
Pour supprimer les logs d'un candidat (à implémenter selon la politique de rétention) :
- Les logs peuvent être anonymisés ou supprimés après une période de rétention
- Conserver les logs nécessaires pour la comptabilité légale

### Traçabilité
Tous les accès sont enregistrés avec :
- Identité du recruteur
- Date et heure précise
- Contexte (IP, User-Agent)
- Type d'accès

## Intégration avec les autres services

### Company Service
Lorsqu'un recruteur consulte un profil candidat :

```python
# Dans company service, après avoir vérifié le quota
async with httpx.AsyncClient() as client:
    await client.post(
        "http://audit:8000/api/v1/audit",
        json={
            "recruiter_id": current_user.id,
            "recruiter_email": current_user.email,
            "recruiter_name": current_user.name,
            "company_id": company.id,
            "company_name": company.name,
            "candidate_id": candidate.id,
            "candidate_email": candidate.email,
            "candidate_name": candidate.name,
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
        f"http://audit:8000/api/v1/audit/candidate/{candidate_id}",
        params={"limit": 100}
    )
    access_logs = response.json()
```

## Exemple de réponse

### Liste des logs
```json
{
  "total": 150,
  "items": [
    {
      "id": 1,
      "recruiter_id": 1,
      "recruiter_email": "recruiter@example.com",
      "recruiter_name": "Jane Recruiter",
      "company_id": 1,
      "company_name": "Acme Corp",
      "candidate_id": 123,
      "candidate_email": "candidate@example.com",
      "candidate_name": "John Doe",
      "accessed_at": "2024-01-15T10:30:00Z",
      "access_type": "profile_view",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Statistiques
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
  }
}
```

## Types d'accès

- `profile_view` : Consultation d'un profil complet
- `document_view` : Consultation d'un document
- `search` : Recherche de candidats
- `export` : Export de données (si implémenté)

## Politique de rétention

**Recommandation** : Conserver les logs pendant 2 ans minimum pour :
- Conformité RGPD
- Audit et sécurité
- Statistiques et analytics

Au-delà, les logs peuvent être :
- Anonymisés (suppression des emails/noms)
- Archivés
- Supprimés (selon la politique de l'entreprise)

## Sécurité

- Les logs sont enregistrés automatiquement (pas de modification possible)
- Seuls les admins peuvent consulter tous les logs
- Les candidats peuvent consulter uniquement leurs propres logs
- Les recruteurs peuvent consulter uniquement leurs propres logs
- Les entreprises peuvent consulter uniquement les logs de leurs recruteurs

## Notes

- Le service est conçu pour être performant même avec un grand volume de logs
- Les index sur `candidate_id`, `recruiter_id`, `company_id`, `accessed_at` optimisent les requêtes
- Les statistiques sont calculées à la volée (peuvent être optimisées avec un cache si nécessaire)


