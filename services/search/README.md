# Search Service

Service de recherche avancée de profils candidats avec Elasticsearch, offrant une recherche full-text robuste et des filtres multiples.

## 🎯 Vue d'ensemble

Le service de recherche permet aux recruteurs de rechercher des profils candidats validés avec :
- Recherche full-text intelligente avec fuzzy search
- Filtres avancés sur tous les critères
- Indexation complète de tous les champs de profil
- Synonymes et boosting pour améliorer la pertinence
- Pagination et tri par pertinence

## ✨ Fonctionnalités

- ✅ Index Elasticsearch `certified_candidates` avec mapping complet
- ✅ Indexation automatique des profils validés
- ✅ Recherche full-text sur titre, résumé, compétences, expériences
- ✅ Filtres par facettes (secteurs, métiers, expérience, score admin, etc.)
- ✅ Recherche dans les compétences avec niveaux (nested queries)
- ✅ Recherche fuzzy pour tolérer les fautes de frappe
- ✅ Synonymes pour compétences et titres de postes
- ✅ Boosting intelligent selon la pertinence
- ✅ Highlighting des termes recherchés
- ✅ Pagination et tri
- ✅ Agrégations pour facettes dynamiques

## 📁 Structure

```
services/search/
├── app/
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── api/v1/
│   │   ├── search.py              # Endpoint de recherche GET
│   │   ├── indexing.py           # Endpoints d'indexation
│   │   └── candidates.py          # Endpoints candidats
│   ├── core/
│   │   ├── config.py              # Configuration
│   │   └── exceptions.py          # Gestion des erreurs
│   ├── domain/
│   │   └── schemas.py             # Schémas Pydantic
│   └── infrastructure/
│       ├── elasticsearch.py      # Client ElasticSearch
│       ├── search_builder.py     # Builder de requêtes GET
│       ├── post_search_builder.py # Builder de requêtes POST (avancé)
│       └── candidate_indexer.py   # Indexation des candidats
├── scripts/
│   └── init_index.py             # Script d'initialisation de l'index
├── Dockerfile
├── requirements.txt
└── README.md
```

## 🔍 Mapping Elasticsearch

L'index `certified_candidates` contient tous les champs nécessaires pour une recherche complète :

### Champs principaux

- **full_name** : Nom complet (text avec analyzer français)
- **title** / **profile_title** : Titre du profil (text, boost 2.0)
- **summary** / **professional_summary** : Résumé professionnel (text)
- **main_job** : Métier principal (text avec autocomplete)
- **sector** : Secteur d'activité (text + keyword)
- **location** : Localisation (text avec analyzer location)
- **years_of_experience** / **total_experience** : Années d'expérience (integer)
- **admin_score** : Score d'évaluation admin (float)
- **is_verified** : Statut de vérification (boolean)
- **status** : Statut du profil (keyword, doit être VALIDATED)

### Champs nested

- **skills** : Compétences avec name, level, years_of_practice
- **experiences** : Expériences avec position, company_name, dates
- **educations** : Formations avec diploma, institution, level
- **languages** : Langues avec name et level

### Champs optionnels

- **contract_type** : Type de contrat souhaité
- **desired_location** : Localisation souhaitée
- **availability** : Disponibilité
- **salary_expectations** : Prétentions salariales
- **photo_url** : URL de la photo de profil
- **admin_report** : Rapport d'évaluation complet

## 🚀 Endpoints

### GET /api/v1/search

Recherche de candidats avec filtres avancés (méthode GET).

**Paramètres de requête :**
- `query` : Recherche full-text
- `sectors` : Filtre par secteurs (séparés par virgules)
- `main_jobs` : Filtre par métiers
- `min_experience` / `max_experience` : Filtre par années d'expérience
- `min_admin_score` : Score admin minimum
- `skills` : Filtre par compétences (format: "Python" ou "Python:Expert")
- `contract_types` : Filtre par types de contrat
- `locations` : Filtre par localisations
- `page` : Numéro de page (défaut: 1)
- `size` : Taille de la page (défaut: 20, max: 100)

**Exemple :**
```bash
GET /api/v1/search?query=développeur&skills=Python:Expert&min_experience=3&page=1&size=20
```

### POST /api/v1/search/search

Recherche avancée avec requête bool ElasticSearch et highlight (méthode POST, recommandée).

**Body :**
```json
{
  "query": "développeur fullstack",
  "job_title": "Développeur Full Stack",
  "skills": ["Python", "React:Advanced"],
  "min_experience": 3,
  "max_experience": 10,
  "location": "Paris",
  "availability": ["immediate", "within_1_month"],
  "education_levels": ["BAC_PLUS_5"],
  "min_salary": 50000,
  "max_salary": 80000,
  "min_admin_score": 4.0,
  "contract_types": ["CDI", "FREELANCE"],
  "sector": "IT & Digital",
  "page": 1,
  "size": 25
}
```

**Réponse :**
```json
{
  "total": 42,
  "page": 1,
  "size": 25,
  "results": [
    {
      "candidate_id": 123,
      "full_name": "Jean Dupont",
      "title": "Développeur Full Stack Senior",
      "main_job": "Développeur Full Stack",
      "summary": "Développeur expérimenté...",
      "summary_highlight": "Développeur <mark>fullstack</mark> expérimenté...",
      "years_of_experience": 5,
      "location": "Paris, France",
      "availability": "immediate",
      "skills": [
        {"name": "Python", "level": "Expert"},
        {"name": "React", "level": "Advanced"}
      ],
      "admin_score": 4.5,
      "is_verified": true,
      "photo_url": "https://...",
      "score": 12.5
    }
  ],
  "facets": {
    "availability": [...],
    "contract_types": [...],
    "sectors": [...],
    "experience_ranges": [...],
    "avg_admin_score": 4.2
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
    "step1": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "profileTitle": "Développeur Full Stack",
      "professionalSummary": "...",
      "sector": "IT & Digital",
      "mainJob": "Développeur",
      "totalExperience": 5
    },
    "step2": {
      "experiences": [...]
    },
    "step3": {
      "educations": [...]
    },
    "step5": {
      "technicalSkills": [...]
    },
    "step7": {
      "contractType": "CDI",
      "availability": "immediate",
      "salaryExpectations": 60000
    },
    "admin_score": 4.5,
    "admin_report": {...}
  }
}
```

### DELETE /api/v1/indexing/index/{candidate_id}

Supprime un profil de l'index (lors d'un rejet ou d'une suppression).

## 🔧 Configuration

Variables d'environnement :

```env
# ElasticSearch
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=changeme
ELASTICSEARCH_USE_SSL=false
ELASTICSEARCH_VERIFY_CERTS=false
ELASTICSEARCH_INDEX_NAME=certified_candidates

# Services
CANDIDATE_SERVICE_URL=http://localhost:8002
ADMIN_SERVICE_URL=http://localhost:8009
FRONTEND_URL=http://localhost:3000
```

## 🛠️ Développement

### Installation locale

```bash
# Installer les dépendances
pip install -r requirements.txt

# Initialiser l'index Elasticsearch (première fois)
python scripts/init_index.py

# Démarrer le service
uvicorn app.main:app --reload --port 8004
```

### Avec Docker

```bash
# Build et démarrage
docker-compose up search-service

# Voir les logs
docker-compose logs -f search-service
```

## 📊 Fonctionnalités de recherche

### Recherche full-text

La recherche texte libre utilise :
- **Multi-match** avec cross_fields pour rechercher dans plusieurs champs
- **Fuzzy search** (AUTO) pour tolérer les fautes de frappe
- **Phrase matching** pour les correspondances exactes (boost maximum)
- **Synonymes** pour les compétences et titres de postes
- **Boosting** : title (4x), main_job (3x), full_name (2x), summary (1.5x)

### Filtres disponibles

- **Titre de poste** : Recherche dans title, main_job et positions d'expériences
- **Compétences** : Recherche nested avec support des niveaux (Python:Expert)
- **Expérience** : Min/max et tranches d'expérience
- **Localisation** : Recherche fuzzy dans location et desired_location
- **Disponibilité** : Filtre exact par statut
- **Niveau d'éducation** : Recherche nested avec synonymes
- **Salaire** : Min/max et tranches salariales
- **Langues** : Recherche nested avec niveaux
- **Score admin** : Filtre par score minimum
- **Types de contrat** : Filtre exact
- **Secteur** : Filtre avec fuzzy search

### Function Score

Le système utilise function_score pour améliorer la pertinence :
- Boost basé sur le score admin (1.0 à 2.0x)
- Boost pour les profils vérifiés (1.2x)
- Boost léger pour l'expérience (jusqu'à 1.3x)
- Boost temporel pour les profils récemment validés (decay)

## 🔗 Intégration

### Indexation automatique

Le service peut être appelé par :
1. **Admin Service** : Après validation d'un profil, appeler `/api/v1/indexing/index`
2. **RabbitMQ** : Consommer les événements `profile.validated` (à implémenter)
3. **Frontend** : Appeler `/api/v1/search/search` pour rechercher des candidats

### Exemple d'intégration

```python
# Dans admin-service après validation
import httpx

async def index_candidate_after_validation(candidate_id: int, profile_data: dict):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{SEARCH_SERVICE_URL}/api/v1/indexing/index",
            json={
                "candidate_id": candidate_id,
                "profile_data": profile_data
            }
        )
```

## 📈 Performance

- **Indexation** : Asynchrone, non-bloquante
- **Recherche** : Optimisée avec filtres et function_score
- **Pagination** : Limite de 100 résultats par page
- **Cache** : Peut être ajouté avec Redis pour les recherches fréquentes

## 🧪 Tests

```bash
# Exécuter les tests
pytest

# Avec couverture
pytest --cov=app
```

## 📚 Documentation supplémentaire

- [Indexation détaillée](./README_INDEXING.md)
- [Requêtes nested](./README_NESTED_QUERIES.md)
- [Recherche POST avancée](./README_POST_SEARCH.md)
- [Améliorations Elasticsearch](./README_ELASTICSEARCH_IMPROVEMENTS.md)

## 🚀 Prochaines étapes

- [ ] Implémenter le consommateur RabbitMQ pour indexation automatique
- [ ] Ajouter la recherche géographique (géolocalisation)
- [ ] Implémenter la recherche par similarité (more_like_this)
- [ ] Ajouter des suggestions de recherche (autocomplete)
- [ ] Optimiser les performances avec des index secondaires
- [ ] Ajouter la recherche par date de validation
- [ ] Implémenter la recherche par entreprise (pour les recruteurs)

## 🐛 Dépannage

### L'index n'existe pas

```bash
# Initialiser l'index
python scripts/init_index.py
```

### Erreur de connexion Elasticsearch

Vérifier que Elasticsearch est démarré :
```bash
curl http://localhost:9200
```

### Recherche ne retourne aucun résultat

1. Vérifier que des profils sont indexés
2. Vérifier le mapping de l'index
3. Vérifier les logs du service

---

**Service développé pour Yemma Solutions**
