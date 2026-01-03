# Search Service

Service de recherche de profils candidats avec ElasticSearch.

## Fonctionnalités

- ✅ Index ElasticSearch `certified_candidates` avec mapping adapté
- ✅ Indexation automatique des profils validés
- ✅ Recherche full-text sur résumé professionnel et titre
- ✅ Filtres par facettes (secteurs, métiers, expérience, score admin, etc.)
- ✅ Recherche dans les compétences (nested)
- ✅ Pagination et tri

## Structure

```
services/search/
├── app/
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── api/v1/
│   │   ├── search.py              # Endpoint de recherche
│   │   └── indexing.py            # Endpoint d'indexation
│   ├── core/
│   │   ├── config.py              # Configuration
│   │   └── exceptions.py          # Gestion des erreurs
│   ├── domain/
│   │   └── schemas.py             # Schémas Pydantic
│   └── infrastructure/
│       ├── elasticsearch.py       # Client ElasticSearch
│       └── search_builder.py      # Builder de requêtes
├── Dockerfile
├── requirements.txt
└── README.md
```

## Mapping ElasticSearch

L'index `certified_candidates` contient :

- **Compétences** : Type `nested` avec name, level, years_of_practice
- **Expérience** : Type `integer` pour total_experience
- **Secteur** : Type `keyword` pour filtrage par facettes
- **Score admin** : Type `float` pour tri et filtrage
- **Résumé professionnel** : Type `text` avec analyseur français pour recherche full-text

## Endpoints

### GET /api/v1/search

Recherche de candidats avec filtres avancés.

**Paramètres de requête :**
- `query` : Recherche full-text
- `sectors` : Filtre par secteurs (séparés par virgules)
- `main_jobs` : Filtre par métiers
- `min_experience` / `max_experience` : Filtre par années d'expérience
- `min_admin_score` : Score admin minimum
- `skills` : Filtre par compétences
- `contract_types` : Filtre par types de contrat
- `locations` : Filtre par localisations
- `page` : Numéro de page (défaut: 1)
- `size` : Taille de la page (défaut: 20, max: 100)

**Réponse :**
```json
{
  "total": 42,
  "page": 1,
  "size": 20,
  "results": [...],
  "facets": {
    "sectors": [...],
    "main_jobs": [...],
    "contract_types": [...],
    "locations": [...],
    "experience_ranges": [...],
    "admin_score_ranges": [...]
  }
}
```

### POST /api/v1/indexing/index

Indexe un profil candidat validé.

**Body :**
```json
{
  "candidate_id": 123,
  "profile_data": {
    "step1": {...},
    "step2": {...},
    ...
    "admin_score": 4.5
  }
}
```

### DELETE /api/v1/indexing/index/{candidate_id}

Supprime un profil de l'index.

## Configuration

Variables d'environnement :

```env
# ElasticSearch
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_USER=
ELASTICSEARCH_PASSWORD=
ELASTICSEARCH_USE_SSL=false
ELASTICSEARCH_INDEX_NAME=certified_candidates

# Services
CANDIDATE_SERVICE_URL=http://localhost:8002
ADMIN_SERVICE_URL=http://localhost:8003
```

## Développement

```bash
# Installer les dépendances
pip install -r requirements.txt

# Démarrer le service
uvicorn app.main:app --reload --port 8004
```

## Docker

```bash
# Build et démarrage
docker-compose up search
```

## Intégration

Le service peut être appelé par :
1. **Admin Service** : Après validation d'un profil, appeler `/api/v1/indexing/index`
2. **RabbitMQ** : Consommer les événements `profile.validated` (à implémenter)
3. **Frontend** : Appeler `/api/v1/search` pour rechercher des candidats

## Prochaines étapes

- [ ] Implémenter le consommateur RabbitMQ pour indexation automatique
- [ ] Ajouter la recherche géographique
- [ ] Implémenter la recherche par similarité (more_like_this)
- [ ] Ajouter des suggestions de recherche (autocomplete)
- [ ] Optimiser les performances avec des index secondaires

