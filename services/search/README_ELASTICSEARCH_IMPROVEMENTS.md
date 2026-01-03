# Améliorations ElasticSearch - POST /search

## Vue d'ensemble

Les améliorations apportées à la requête ElasticSearch dans `POST /api/v1/search/search` incluent :
1. **Nested Query avec niveau minimum** pour les compétences
2. **Boosting** pour le titre et le métier principal
3. **Highlighting amélioré** sur titre, métier principal et résumé

## 1. Nested Query avec Niveau Minimum

### Fonctionnalité

Lorsqu'une compétence est recherchée avec un niveau (ex: `Python:Expert`), la requête trouve tous les candidats ayant cette compétence avec le niveau **minimum** spécifié ou supérieur.

### Hiérarchie des niveaux

```
BEGINNER (1) < INTERMEDIATE (2) < ADVANCED (3) < EXPERT (4)
```

### Exemple

Recherche `Python:ADVANCED` trouvera :
- ✅ Python avec niveau ADVANCED
- ✅ Python avec niveau EXPERT
- ❌ Python avec niveau INTERMEDIATE
- ❌ Python avec niveau BEGINNER

### Implémentation

La fonction `get_levels_minimum()` retourne tous les niveaux >= au niveau minimum :

```python
SKILL_LEVEL_HIERARCHY = {
    "BEGINNER": 1,
    "INTERMEDIATE": 2,
    "ADVANCED": 3,
    "EXPERT": 4
}

def get_levels_minimum(min_level: str) -> List[str]:
    """Retourne la liste des niveaux >= au niveau minimum"""
    min_level_upper = min_level.upper()
    min_value = SKILL_LEVEL_HIERARCHY.get(min_level_upper, 0)
    
    levels = []
    for level, value in SKILL_LEVEL_HIERARCHY.items():
        if value >= min_value:
            levels.append(level)
    
    return levels
```

### Requête ElasticSearch générée

```json
{
  "nested": {
    "path": "skills",
    "query": {
      "bool": {
        "must": [
          {"term": {"skills.name.keyword": "Python"}}
        ],
        "should": [
          {"term": {"skills.level": "ADVANCED"}},
          {"term": {"skills.level": "EXPERT"}}
        ],
        "minimum_should_match": 1
      }
    }
  }
}
```

## 2. Boosting pour Titre et Métier Principal

### Fonctionnalité

Le boosting permet d'augmenter le score de pertinence pour certains champs. Les champs sont boostés dans cet ordre :

1. **Titre** (`title`) : **boost 3.0** (le plus important)
2. **Métier principal** (`main_job`) : **boost 2.5**
3. **Compétences** (`skills.name`) : **boost 1.5**
4. **Résumé** (`summary`) : **boost 1.0** (poids normal)

### Exemple

Recherche `"développeur"` :
- Un candidat avec "Développeur Full Stack" dans le **titre** aura un score plus élevé
- Un candidat avec "Développeur" dans le **métier principal** aura un score moyen
- Un candidat avec "développeur" uniquement dans le **résumé** aura un score plus bas

### Implémentation

```python
must_clauses.append({
    "bool": {
        "should": [
            {
                "match": {
                    "title": {
                        "query": search_request.query,
                        "boost": 3.0,  # Boost le titre
                        "fuzziness": "AUTO",
                        "operator": "or"
                    }
                }
            },
            {
                "match": {
                    "main_job": {
                        "query": search_request.query,
                        "boost": 2.5,  # Boost le métier principal
                        "fuzziness": "AUTO",
                        "operator": "or"
                    }
                }
            },
            {
                "match": {
                    "summary": {
                        "query": search_request.query,
                        "boost": 1.0,  # Résumé avec poids normal
                        "fuzziness": "AUTO",
                        "operator": "or"
                    }
                }
            }
        ],
        "minimum_should_match": 1
    }
})
```

## 3. Highlighting Amélioré

### Fonctionnalité

Le highlighting permet de surligner les termes recherchés dans les résultats. Les champs suivants sont highlightés :

1. **Titre** (`title`)
2. **Métier principal** (`main_job`)
3. **Résumé** (`summary`) - avec 2 fragments pour plus de contexte
4. **Compétences** (`skills.name`)

### Configuration

```json
{
  "highlight": {
    "fields": {
      "title": {
        "fragment_size": 100,
        "number_of_fragments": 1,
        "pre_tags": ["<mark class='highlight'>"],
        "post_tags": ["</mark>"],
        "type": "unified"
      },
      "main_job": {
        "fragment_size": 100,
        "number_of_fragments": 1,
        "pre_tags": ["<mark class='highlight'>"],
        "post_tags": ["</mark>"],
        "type": "unified"
      },
      "summary": {
        "fragment_size": 200,
        "number_of_fragments": 2,
        "pre_tags": ["<mark class='highlight'>"],
        "post_tags": ["</mark>"],
        "type": "unified"
      }
    },
    "require_field_match": false,
    "boundary_scanner": "word",
    "boundary_chars": ".,!? \t\n"
  }
}
```

### Réponse API

La réponse inclut maintenant les highlights séparés :

```json
{
  "candidate_id": 123,
  "title": "Développeur Full Stack",
  "title_highlight": "<mark class='highlight'>Développeur</mark> Full Stack",
  "main_job": "Développeur Backend",
  "main_job_highlight": "<mark class='highlight'>Développeur</mark> Backend",
  "summary": "Expérience en développement...",
  "summary_highlight": "...<mark class='highlight'>développeur</mark> expérimenté..."
}
```

## Exemples d'utilisation

### Exemple 1 : Recherche avec niveau minimum

```json
POST /api/v1/search/search
{
  "query": "développeur",
  "skills": ["Python:ADVANCED", "React:INTERMEDIATE"],
  "min_experience": 3
}
```

Trouve les candidats ayant :
- Python avec niveau ADVANCED ou EXPERT
- OU React avec niveau INTERMEDIATE, ADVANCED ou EXPERT
- Avec au moins 3 ans d'expérience

### Exemple 2 : Recherche avec boosting

```json
POST /api/v1/search/search
{
  "query": "développeur full stack",
  "min_experience": 2
}
```

Les résultats seront triés par score de pertinence :
1. Candidats avec "développeur full stack" dans le **titre** (score le plus élevé)
2. Candidats avec "développeur" dans le **métier principal**
3. Candidats avec "développeur" dans le **résumé** (score plus bas)

### Exemple 3 : Highlighting dans le frontend

```javascript
// Afficher le titre avec highlight
const title = result.title_highlight || result.title;
<div dangerouslySetInnerHTML={{ __html: title }} />

// Afficher le résumé avec highlight
const summary = result.summary_highlight || result.summary;
<div dangerouslySetInnerHTML={{ __html: summary }} />
```

## Avantages

1. **Précision** : Nested queries avec niveau minimum permettent une recherche plus précise
2. **Pertinence** : Le boosting améliore le classement des résultats
3. **UX** : Le highlighting permet aux utilisateurs de voir rapidement pourquoi un résultat est pertinent
4. **Performance** : Les nested queries sont optimisées par ElasticSearch

## Notes importantes

- Les niveaux de compétence doivent être en majuscules (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)
- Le highlighting utilise des balises `<mark>` avec la classe `highlight` pour le styling CSS
- Le champ `main_job` doit être indexé dans ElasticSearch pour que le boosting fonctionne
- Les fragments de highlight sont limités à 200 caractères pour le résumé

