# Nested Queries pour les Compétences

## Vue d'ensemble

Le service de recherche utilise des **Nested Queries** pour rechercher les compétences avec précision, permettant de filtrer à la fois par **nom** et **niveau** de compétence.

## Structure des données

Les compétences sont indexées dans ElasticSearch comme un champ `nested` :

```json
{
  "skills": [
    {
      "name": "Python",
      "level": "EXPERT"
    },
    {
      "name": "React",
      "level": "ADVANCED"
    }
  ]
}
```

## Format de recherche

### Format simple (nom seulement)

Recherche par nom de compétence uniquement :

```
GET /api/v1/search?skills=Python,React
```

Cette requête trouvera tous les candidats ayant Python OU React, quel que soit le niveau.

### Format avec niveau (nom + niveau)

Recherche précise par nom ET niveau :

```
GET /api/v1/search?skills=Python:EXPERT,React:ADVANCED
```

Cette requête trouvera uniquement les candidats ayant :
- Python avec le niveau EXPERT
- OU React avec le niveau ADVANCED

## Implémentation technique

### Nested Query avec Bool Query

La requête ElasticSearch générée utilise une structure nested avec bool query :

```json
{
  "nested": {
    "path": "skills",
    "query": {
      "bool": {
        "should": [
          {
            "bool": {
              "must": [
                {"term": {"skills.name.keyword": "Python"}},
                {"term": {"skills.level": "EXPERT"}}
              ]
            }
          },
          {
            "bool": {
              "must": [
                {"term": {"skills.name.keyword": "React"}},
                {"term": {"skills.level": "ADVANCED"}}
              ]
            }
          }
        ],
        "minimum_should_match": 1
      }
    }
  }
}
```

### Explication

1. **`nested`** : Indique que nous recherchons dans un champ nested
2. **`path: "skills"`** : Le chemin vers le champ nested
3. **`bool.should`** : OR entre les différentes compétences recherchées
4. **`bool.must`** : AND entre le nom et le niveau pour chaque compétence
5. **`minimum_should_match: 1`** : Au moins une compétence doit matcher

## Exemples d'utilisation

### Exemple 1 : Recherche simple

```bash
GET /api/v1/search?skills=Python
```

Trouve tous les candidats ayant Python (tous niveaux confondus).

### Exemple 2 : Recherche précise

```bash
GET /api/v1/search?skills=Python:EXPERT
```

Trouve uniquement les candidats ayant Python avec le niveau EXPERT.

### Exemple 3 : Recherche multiple

```bash
GET /api/v1/search?skills=Python:EXPERT,React:ADVANCED,JavaScript
```

Trouve les candidats ayant :
- Python niveau EXPERT
- OU React niveau ADVANCED
- OU JavaScript (tous niveaux)

### Exemple 4 : Via POST avec JSON

```json
POST /api/v1/search/search
{
  "query": "développeur",
  "skills": ["Python:EXPERT", "React:ADVANCED"],
  "min_experience": 3
}
```

Ou avec le format explicite :

```json
POST /api/v1/search/search
{
  "query": "développeur",
  "skills_with_level": [
    {"name": "Python", "level": "EXPERT"},
    {"name": "React", "level": "ADVANCED"}
  ],
  "min_experience": 3
}
```

## Niveaux de compétence

Les niveaux acceptés sont :
- `BEGINNER` (Débutant)
- `INTERMEDIATE` (Intermédiaire)
- `ADVANCED` (Avancé)
- `EXPERT` (Expert)

## Avantages des Nested Queries

1. **Précision** : Permet de rechercher exactement "Python + Expert" sans confusion
2. **Performance** : Les nested queries sont optimisées par ElasticSearch
3. **Flexibilité** : Supporte à la fois recherche simple (nom) et précise (nom + niveau)
4. **Cohérence** : Respecte la structure nested des données indexées

## Notes importantes

- Les recherches par nom seul utilisent `skills.name.keyword` pour une correspondance exacte
- Les recherches par niveau utilisent `skills.level` (champ keyword)
- Les compétences sont combinées avec un OR (should) : au moins une doit matcher
- Pour une recherche AND (toutes les compétences doivent matcher), il faudrait utiliser plusieurs nested queries dans un bool must

