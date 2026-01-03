# Validation avec BackgroundTasks

## Vue d'ensemble

L'endpoint `POST /api/v1/admin/validate/{candidate_id}` utilise **BackgroundTasks de FastAPI** pour exécuter toutes les actions de manière asynchrone.

## Architecture

### Actions asynchrones

Lors de la validation d'un candidat, trois actions sont déclenchées en arrière-plan :

1. **Mise à jour du statut** dans le Candidate Service
2. **Indexation** dans ElasticSearch via le Search Service
3. **Notification** au candidat via le Notification Service

### Gestion d'erreur

Si l'indexation ElasticSearch échoue, l'incident est automatiquement enregistré dans le **Service Audit** pour traçabilité.

## Endpoint

### POST /api/v1/admin/validate/{candidate_id}

Valide un profil candidat avec actions asynchrones.

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

**Réponse (succès):**
```json
{
  "message": "Candidate profile validation initiated",
  "candidate_id": 123,
  "status": "VALIDATED",
  "actions": {
    "status_update": "pending",
    "indexation": "pending",
    "notification": "pending"
  },
  "note": "All actions are being processed asynchronously. Check Audit Service logs for any errors."
}
```

## Tâches en arrière-plan

### 1. update_candidate_status_task()

Met à jour le statut du candidat à `VALIDATED` dans le Candidate Service.

**En cas d'erreur :**
- L'incident est loggé dans le Service Audit avec le type `candidate_status_update_failed`

### 2. index_candidate_task()

Indexe le candidat dans ElasticSearch via le Search Service.

**En cas d'erreur :**
- L'incident est loggé dans le Service Audit avec le type `indexation_failed`
- Les métadonnées incluent :
  - `error`: Message d'erreur
  - `error_type`: Type d'exception
  - `profile_data_keys`: Clés des données du profil

### 3. send_notification_task()

Envoie une notification email au candidat via le Notification Service.

**En cas d'erreur :**
- L'erreur est loggée dans les logs système (non-bloquant)

## Service Audit

### Enregistrement des incidents

Le Service Audit enregistre les incidents avec les informations suivantes :

- **recruiter_id**: 0 (Système)
- **recruiter_email**: "system@yemma.com"
- **recruiter_name**: "Système Yemma"
- **company_id**: 0 (Système)
- **company_name**: "Yemma Platform"
- **candidate_id**: ID du candidat concerné
- **access_type**: "system_incident"
- **action_type**: "SYSTEM_ERROR"
- **metadata**: Détails de l'incident (type, description, timestamp, erreur)

### Types d'incidents

- `indexation_failed`: Échec de l'indexation ElasticSearch
- `candidate_status_update_failed`: Échec de la mise à jour du statut

## Avantages de cette approche

1. **Performance** : Réponse immédiate à l'utilisateur
2. **Résilience** : Les erreurs ne bloquent pas le processus principal
3. **Traçabilité** : Tous les incidents sont enregistrés dans le Service Audit
4. **Asynchrone** : Les actions longues (indexation, notification) ne bloquent pas

## Limitations

1. **Pas de garantie de cohérence immédiate** : Les actions sont asynchrones, donc il peut y avoir un délai
2. **Pas de rollback automatique** : Si une action échoue, les autres continuent
3. **Monitoring requis** : Il faut surveiller les logs du Service Audit pour détecter les erreurs

## Monitoring

Pour surveiller les incidents :

1. **Service Audit** : Consulter les logs avec `action_type = "SYSTEM_ERROR"`
2. **Logs système** : Vérifier les logs de l'Admin Service
3. **Métriques** : Surveiller le taux de succès des indexations

## Exemple d'incident enregistré

```json
{
  "recruiter_id": 0,
  "recruiter_email": "system@yemma.com",
  "recruiter_name": "Système Yemma",
  "company_id": 0,
  "company_name": "Yemma Platform",
  "candidate_id": 123,
  "access_type": "system_incident",
  "action_type": "SYSTEM_ERROR",
  "metadata": {
    "incident_type": "indexation_failed",
    "description": "Erreur lors de l'indexation ElasticSearch pour le candidat 123: Connection timeout",
    "timestamp": "2024-01-15T10:30:00Z",
    "error": "Connection timeout",
    "error_type": "TimeoutError"
  }
}
```

