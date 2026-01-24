# Admin Service

Service d'administration et de validation des profils candidats pour la plateforme Yemma Solutions.

## 🎯 Vue d'ensemble

Le service admin orchestre la validation, le rejet et l'archivage des profils candidats. Il fait le lien entre le service candidat (données) et le service recherche (indexation).

## ✨ Fonctionnalités

- ✅ Validation de profils candidats avec scores détaillés
- ✅ Rejet de profils avec motif de rejet
- ✅ Archivage de profils
- ✅ Appels asynchrones au service recherche pour indexation/suppression
- ✅ Intégration avec le service candidat pour récupération des données
- ✅ Génération de rapports d'évaluation complets
- ✅ Gestion des scores par critères (technique, soft skills, communication, motivation)

## 📁 Structure

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

## 🚀 Endpoints

### POST /api/v1/admin/validate/{candidate_id}

Valide un profil candidat avec évaluation complète.

**Body :**
```json
{
  "overallScore": 4.5,
  "technicalSkills": 4.0,
  "softSkills": 4.5,
  "communication": 5.0,
  "motivation": 4.5,
  "softSkillsTags": ["leadership", "teamwork", "problem-solving"],
  "summary": "Candidat très compétent avec une excellente expérience dans le développement full-stack. Excellente communication et motivation élevée.",
  "recommendations": "Recommandé pour poste senior. Très bon fit culturel."
}
```

**Comportement :**
1. Met à jour le statut à `VALIDATED` dans le service candidat
2. Enregistre le score admin et le rapport complet
3. Déclenche un appel asynchrone (BackgroundTask) vers le service recherche
4. Envoie toutes les données structurées du profil pour indexation
5. Envoie une notification au candidat (via notification-service)

**Permissions** : ROLE_ADMIN ou ROLE_SUPER_ADMIN

### POST /api/v1/admin/reject/{candidate_id}

Rejette un profil candidat avec motif.

**Body :**
```json
{
  "rejectionReason": "Profil ne correspond pas aux critères requis pour le poste",
  "overallScore": 2.5,
  "technicalSkills": 2.0,
  "softSkills": 3.0,
  "communication": 3.0,
  "motivation": 2.5,
  "summary": "Manque d'expérience dans les technologies requises. Niveau technique insuffisant."
}
```

**Comportement :**
1. Met à jour le statut à `REJECTED` dans le service candidat
2. Enregistre le motif de rejet et le score
3. Déclenche un appel asynchrone pour supprimer le candidat de l'index de recherche
4. Envoie une notification au candidat (via notification-service)

**Permissions** : ROLE_ADMIN ou ROLE_SUPER_ADMIN

### POST /api/v1/admin/archive/{candidate_id}

Archive un profil candidat.

**Body :**
```json
{
  "archiveReason": "Profil obsolète ou candidat non disponible"
}
```

**Comportement :**
1. Met à jour le statut à `ARCHIVED` dans le service candidat
2. Déclenche un appel asynchrone pour supprimer le candidat de l'index de recherche
3. Le profil reste accessible en base de données pour historique

**Permissions** : ROLE_ADMIN ou ROLE_SUPER_ADMIN

## 🔄 Intégration avec le Service Recherche

### Indexation (VALIDATED)

Lorsqu'un profil est validé, le service admin :

1. **Récupère le profil complet** depuis le service candidat
2. **Convertit les données** au format attendu par le service recherche :
   - `full_name`: Prénom + Nom
   - `title`: Titre du profil
   - `summary`: Résumé professionnel
   - `skills`: Compétences techniques avec name et level
   - `years_of_experience`: Années d'expérience totale
   - `location`: Ville, Pays
   - `is_verified`: true
   - `admin_score`: Score d'évaluation
   - `admin_report`: Rapport complet
   - `experiences`, `educations`, `languages`: Données complètes
3. **Appelle de manière asynchrone** `POST /api/v1/indexing/index` du service recherche

### Suppression (REJECTED / ARCHIVED)

Lorsqu'un profil est rejeté ou archivé, le service admin :

1. **Appelle de manière asynchrone** `DELETE /api/v1/indexing/index/{candidate_id}` du service recherche
2. Le candidat est retiré de l'index mais conservé en base de données

## ⚡ Appels asynchrones

Les appels au service recherche sont effectués via **BackgroundTasks** de FastAPI :

- ✅ **Non-bloquants** : La réponse est retournée immédiatement
- ✅ **Résilients** : Les erreurs sont loggées mais n'interrompent pas le processus
- ✅ **Performants** : Pas d'attente de la réponse du service recherche

**Exemple :**
```python
from fastapi import BackgroundTasks

@router.post("/validate/{candidate_id}")
async def validate_profile(
    candidate_id: int,
    evaluation: EvaluationRequest,
    background_tasks: BackgroundTasks
):
    # Validation synchrone
    await candidate_client.update_status(candidate_id, "VALIDATED")
    
    # Indexation asynchrone
    background_tasks.add_task(
        index_candidate_async,
        candidate_id,
        profile_data
    )
    
    return {"message": "Profile validated"}
```

## ⚙️ Configuration

Variables d'environnement :

```env
# Service URLs
CANDIDATE_SERVICE_URL=http://candidate-service:8002
SEARCH_SERVICE_URL=http://search-service:8004
NOTIFICATION_SERVICE_URL=http://notification-service:8007

# JWT
JWT_SECRET_KEY=your-secret-key
AUTH_SERVICE_URL=http://auth-service:8001

# Port
ADMIN_PORT=8009
```

## 🛠️ Développement

### Installation locale

```bash
# Installer les dépendances
pip install -r requirements.txt

# Démarrer le service
uvicorn app.main:app --reload --port 8009
```

### Avec Docker

```bash
# Build et démarrage
docker-compose up admin-service

# Voir les logs
docker-compose logs -f admin-service
```

## 📊 Modèle d'évaluation

### Scores par critères

Chaque profil peut être évalué sur 5 critères (0-5) :

1. **overallScore** : Score global (obligatoire)
2. **technicalSkills** : Compétences techniques (optionnel)
3. **softSkills** : Compétences comportementales (optionnel)
4. **communication** : Capacité de communication (optionnel)
5. **motivation** : Motivation et engagement (optionnel)

### Rapport d'évaluation

Le rapport complet (`admin_report`) contient :
- Tous les scores
- Tags de soft skills
- Résumé de l'évaluation
- Recommandations
- Notes d'entretien (si applicable)

## 🧪 Tests

```bash
# Exécuter les tests
pytest

# Avec couverture
pytest --cov=app
```

## 📝 Exemples d'utilisation

### Valider un profil

```bash
curl -X POST http://localhost:8009/api/v1/admin/validate/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "overallScore": 4.5,
    "technicalSkills": 4.0,
    "softSkills": 4.5,
    "communication": 5.0,
    "motivation": 4.5,
    "softSkillsTags": ["leadership", "teamwork"],
    "summary": "Excellent candidat...",
    "recommendations": "Recommandé pour poste senior"
  }'
```

### Rejeter un profil

```bash
curl -X POST http://localhost:8009/api/v1/admin/reject/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rejectionReason": "Profil ne correspond pas aux critères",
    "overallScore": 2.5,
    "summary": "Manque d\'expérience..."
  }'
```

## 🔍 Notes importantes

- ✅ Les appels au service recherche sont asynchrones et non-bloquants
- ✅ En cas d'erreur lors de l'indexation/suppression, l'erreur est loggée mais ne bloque pas la validation/rejet
- ✅ Le service admin ne stocke pas les données, il orchestre les appels aux autres services
- ✅ Les données du profil sont récupérées depuis le service candidat avant indexation
- ✅ Les notifications sont envoyées de manière asynchrone

## 🚀 Prochaines étapes

- [ ] Implémenter la recherche de profils depuis le service admin
- [ ] Ajouter la gestion des commentaires et notes internes
- [ ] Implémenter l'historique des validations/rejets
- [ ] Ajouter les statistiques d'évaluation
- [ ] Implémenter les workflows d'approbation multi-niveaux

---

**Service développé pour Yemma Solutions**
