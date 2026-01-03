# Endpoint POST /search

Endpoint de recherche avec requête bool ElasticSearch, fuzzy search et highlight.

## Endpoint

**POST** `/api/v1/search/search`

## Paramètres

```json
{
  "query": "développeur python",           // Texte libre (optionnel)
  "min_experience": 3,                     // Expérience minimum (optionnel)
  "skills": ["Python", "React"],           // Liste de compétences (optionnel)
  "location": "Paris, France",            // Localisation (optionnel)
  "page": 1,                               // Numéro de page (défaut: 1)
  "size": 20                               // Taille de la page (défaut: 20, max: 100)
}
```

## Requête ElasticSearch

L'endpoint construit une requête **bool** avec :

### MUST (recherche texte libre avec fuzzy)
- Recherche sur `title` (boost: 2.0)
- Recherche sur `summary` (boost: 1.5)
- Recherche sur `skills.name` (nested)
- **Fuzziness**: AUTO (tolère les fautes de frappe)
- **Operator**: OR (au moins un terme doit correspondre)

### FILTER (plus performant, pas de scoring)
- `years_of_experience >= min_experience` (range query)
- `location == location` (term query, exact match)
- `skills.name IN skills` (nested terms query)

### Highlight
- Highlight sur `summary` avec tags `<mark>`
- Highlight sur `title` avec tags `<mark>`
- Fragment size: 150 caractères pour le résumé

## Réponse

```json
{
  "total": 42,
  "page": 1,
  "size": 20,
  "results": [
    {
      "candidate_id": 123,
      "full_name": "John Doe",
      "title": "Développeur Full Stack",
      "summary": "Développeur expérimenté en Python et React...",
      "summary_highlight": "Développeur expérimenté en <mark>Python</mark> et <mark>React</mark>...",
      "years_of_experience": 5,
      "location": "Paris, France",
      "skills": [
        {"name": "Python", "level": "Expert"},
        {"name": "React", "level": "Avancé"}
      ],
      "is_verified": true,
      "score": 12.5
    }
  ]
}
```

## Exemple d'utilisation

### Recherche simple

```bash
curl -X POST http://localhost:8004/api/v1/search/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "développeur python"
  }'
```

### Recherche avec filtres

```bash
curl -X POST http://localhost:8004/api/v1/search/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "développeur",
    "min_experience": 3,
    "skills": ["Python", "React"],
    "location": "Paris, France",
    "page": 1,
    "size": 20
  }'
```

### Recherche sans texte libre (filtres uniquement)

```bash
curl -X POST http://localhost:8004/api/v1/search/search \
  -H "Content-Type: application/json" \
  -d '{
    "min_experience": 5,
    "skills": ["Python"],
    "location": "Lyon, France"
  }'
```

## Avantages de la requête bool

### MUST (texte libre)
- **Fuzzy search** : Tolère les fautes de frappe
- **Scoring** : Les résultats sont triés par pertinence
- **Multi-champs** : Recherche sur titre, résumé et compétences

### FILTER (filtres)
- **Performance** : Pas de calcul de score, plus rapide
- **Cache** : Les filtres peuvent être mis en cache par ElasticSearch
- **Exact match** : Pour les valeurs exactes (localisation, compétences)

## Highlight

Le highlight permet de :
- Visualiser les termes recherchés dans le résumé
- Améliorer l'UX en montrant pourquoi un résultat correspond
- Utiliser les tags `<mark>` pour le style CSS

### Exemple de highlight

Si vous recherchez "python", le résumé peut être retourné comme :
```
Développeur expérimenté en <mark>Python</mark> avec 5 ans d'expérience...
```

## Tri des résultats

Les résultats sont triés par :
1. **Score de pertinence** (descendant)
2. **Années d'expérience** (descendant)

## Notes

- La recherche fuzzy tolère jusqu'à 2 caractères de différence (AUTO)
- Les filtres sont appliqués après la recherche texte (plus performant)
- Le highlight est limité à 1 fragment de 150 caractères pour le résumé
- Les compétences sont recherchées via une nested query

