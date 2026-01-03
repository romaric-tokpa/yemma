# Service d'Indexation ElasticSearch

Ce service FastAPI permet d'indexer des candidats dans ElasticSearch avec un mapping spécifique.

## Mapping de l'index

L'index `candidates` est défini avec le mapping suivant :

- **full_name**: `text` - Nom complet du candidat
- **title**: `text` (boost: 2.0) - Titre du profil (boosté pour la recherche)
- **skills**: `nested` - Compétences avec :
  - `name`: `keyword`
  - `level`: `keyword`
- **years_of_experience**: `integer` - Années d'expérience
- **location**: `keyword` - Localisation
- **is_verified**: `boolean` - Statut de vérification
- **summary**: `text` - Résumé professionnel

## Script d'initialisation

### Créer l'index avec le mapping

```bash
# Depuis le répertoire du service
python scripts/init_index.py
```

Le script :
1. Se connecte à ElasticSearch
2. Supprime l'index existant s'il existe (pour réinitialisation)
3. Crée l'index `candidates` avec le mapping spécifique
4. Affiche le mapping créé

## Fonction index_candidate()

La fonction `index_candidate(candidate_data)` convertit un objet candidat en document ElasticSearch.

### Utilisation

```python
from app.infrastructure.candidate_indexer import index_candidate

# Données candidat
candidate_data = {
    "candidate_id": 123,
    "full_name": "John Doe",
    "title": "Développeur Full Stack",
    "skills": [
        {"name": "Python", "level": "Expert"},
        {"name": "React", "level": "Avancé"}
    ],
    "years_of_experience": 5,
    "location": "Paris, France",
    "is_verified": True,
    "summary": "Développeur expérimenté en Python et React..."
}

# Convertir en document ElasticSearch
document = index_candidate(candidate_data)
```

### Format de sortie

```python
{
    "full_name": "John Doe",
    "title": "Développeur Full Stack",
    "skills": [
        {"name": "Python", "level": "Expert"},
        {"name": "React", "level": "Avancé"}
    ],
    "years_of_experience": 5,
    "location": "Paris, France",
    "is_verified": True,
    "summary": "Développeur expérimenté...",
    "candidate_id": 123
}
```

## Endpoints API

### POST /api/v1/candidates/index

Indexe un candidat dans ElasticSearch.

**Body:**
```json
{
  "candidate_id": 123,
  "full_name": "John Doe",
  "title": "Développeur Full Stack",
  "skills": [
    {"name": "Python", "level": "Expert"},
    {"name": "React", "level": "Avancé"}
  ],
  "years_of_experience": 5,
  "location": "Paris, France",
  "is_verified": true,
  "summary": "Développeur expérimenté..."
}
```

**Réponse:**
```json
{
  "message": "Candidate indexed successfully",
  "candidate_id": 123
}
```

### POST /api/v1/candidates/index/bulk

Indexe plusieurs candidats en une seule opération.

**Body:**
```json
{
  "candidates": [
    {
      "candidate_id": 123,
      "full_name": "John Doe",
      ...
    },
    {
      "candidate_id": 124,
      "full_name": "Jane Smith",
      ...
    }
  ]
}
```

### DELETE /api/v1/candidates/index/{candidate_id}

Supprime un candidat de l'index.

### GET /api/v1/candidates/index/{candidate_id}

Récupère un candidat de l'index.

## Exemple d'utilisation complète

```python
import asyncio
from app.infrastructure.candidate_indexer import index_candidate_async

async def main():
    candidate_data = {
        "candidate_id": 123,
        "full_name": "John Doe",
        "title": "Développeur Full Stack",
        "skills": [
            {"name": "Python", "level": "Expert"},
            {"name": "React", "level": "Avancé"}
        ],
        "years_of_experience": 5,
        "location": "Paris, France",
        "is_verified": True,
        "summary": "Développeur expérimenté..."
    }
    
    # Indexer le candidat
    success = await index_candidate_async(candidate_data)
    print(f"Indexation réussie: {success}")

asyncio.run(main())
```

## Notes

- Le champ `title` est boosté (boost: 2.0) pour avoir plus de poids dans les recherches
- Les compétences sont stockées en `nested` pour permettre des requêtes complexes
- Le script d'initialisation peut être exécuté plusieurs fois (supprime et recrée l'index)
- Pour la production, ajustez `number_of_replicas` dans les settings de l'index

