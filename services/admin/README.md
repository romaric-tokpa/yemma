# Admin Service

Service d'administration et de validation des profils candidats.

## Fonctionnalités

- ✅ Validation de profils candidats
- ✅ Rejet de profils avec motif
- ✅ Archivage de profils
- ✅ Appels asynchrones au Service Recherche pour indexation/suppression
- ✅ Intégration avec le Service Candidat pour récupération des données

## Architecture

```
services/admin/
├── app/
│   ├── main.py                    # FastAPI app
│   ├── api/v1/
│   │   └── validation.py         # Endpoints de validation/rejet/archivage
│   ├── core/
│   │   ├── config.py             # Configuration
│   │   └── exceptions.py         # Gestion des erreurs
│   └── infrastructure/
│       ├── candidate_client.py  # Client pour le service candidat
│       └── search_client.py      # Client pour le service recherche
├── Dockerfile
├── requirements.txt
└── README.md
```

## Endpoints

### POST /api/v1/admin/validate/{candidate_id}

Valide un profil candidat.

**Body:**
```json
{
  "overallScore": 4.5,
  "technicalSkills": 4.0,
  "softSkills": 4.5,
  "communication": 5.0,
  "motivation": 4.5,
  "softSkillsTags": ["leadership", "teamwork"],
  "interview_notes": "Excellent candidat...",
  "recommendations": "Recommandé pour poste senior",
  "summary": "Candidat très compétent avec une excellente expérience..."
}
```

**Comportement:**
1. Met à jour le statut à `VALIDATED` dans le service candidat
2. Déclenche un appel asynchrone (BackgroundTask) vers le service recherche
3. Envoie toutes les données structurées du profil pour indexation

### POST /api/v1/admin/reject/{candidate_id}

Rejette un profil candidat.

**Body:**
```json
{
  "rejectionReason": "Profil ne correspond pas aux critères requis",
  "overallScore": 2.5,
  "interview_notes": "Manque d'expérience dans le domaine"
}
```

**Comportement:**
1. Met à jour le statut à `REJECTED` dans le service candidat
2. Déclenche un appel asynchrone pour supprimer le candidat de l'index de recherche

### POST /api/v1/admin/archive/{candidate_id}

Archive un profil candidat.

**Comportement:**
1. Met à jour le statut à `ARCHIVED` dans le service candidat
2. Déclenche un appel asynchrone pour supprimer le candidat de l'index de recherche

## Intégration avec le Service Recherche

### Indexation (VALIDATED)

Lorsqu'un profil est validé, le service admin :
1. Récupère le profil complet depuis le service candidat
2. Convertit les données au format attendu par le service recherche :
   - `full_name`: Prénom + Nom
   - `title`: Titre du profil
   - `skills`: Compétences techniques avec name et level
   - `years_of_experience`: Années d'expérience totale
   - `location`: Ville, Pays
   - `is_verified`: true
   - `summary`: Résumé professionnel
3. Appelle de manière asynchrone `POST /api/v1/candidates/index` du service recherche

### Suppression (REJECTED / ARCHIVED)

Lorsqu'un profil est rejeté ou archivé, le service admin :
1. Appelle de manière asynchrone `DELETE /api/v1/candidates/index/{candidate_id}` du service recherche
2. Le candidat est retiré de l'index mais conservé en base de données

## Appels asynchrones

Les appels au service recherche sont effectués via **BackgroundTasks** de FastAPI :
- Non-bloquants : La réponse est retournée immédiatement
- Résilients : Les erreurs sont loggées mais n'interrompent pas le processus
- Performants : Pas d'attente de la réponse du service recherche

## Configuration

Variables d'environnement :

```env
# Service URLs
CANDIDATE_SERVICE_URL=http://candidate:8000
SEARCH_SERVICE_URL=http://search:8000
NOTIFICATION_SERVICE_URL=http://notification:8000

# Port
ADMIN_PORT=8003
```

## Utilisation

### Valider un profil

```bash
curl -X POST http://localhost:8003/api/v1/admin/validate/123 \
  -H "Content-Type: application/json" \
  -d '{
    "overallScore": 4.5,
    "technicalSkills": 4.0,
    "summary": "Excellent candidat..."
  }'
```

### Rejeter un profil

```bash
curl -X POST http://localhost:8003/api/v1/admin/reject/123 \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Profil ne correspond pas aux critères",
    "overallScore": 2.5
  }'
```

## Notes

- Les appels au service recherche sont asynchrones et non-bloquants
- En cas d'erreur lors de l'indexation/suppression, l'erreur est loggée mais ne bloque pas la validation/rejet
- Le service admin ne stocke pas les données, il orchestre les appels aux autres services
- Les données du profil sont récupérées depuis le service candidat avant indexation
