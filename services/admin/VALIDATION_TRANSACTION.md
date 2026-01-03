# Transaction Distribuée pour la Validation de Candidat

## Vue d'ensemble

L'endpoint `POST /api/v1/admin/validate/{candidate_id}` implémente une **transaction distribuée simple** pour garantir la cohérence des données entre les services.

## Flux de Validation

### Ordre des opérations

1. **Indexation ElasticSearch** (SYNCHRONE - bloquant)
   - Si cette étape échoue → **Validation annulée**
   - Le candidat n'est pas validé

2. **Mise à jour du statut** (SYNCHRONE - bloquant)
   - Effectuée uniquement si l'indexation a réussi
   - Met à jour le statut à `VALIDATED` dans le Candidate Service
   - Enregistre le rapport d'évaluation

3. **Notification email** (ASYNCHRONE - non-bloquant)
   - Envoyée en arrière-plan via `BackgroundTasks`
   - Si cette étape échoue, la validation reste valide

## Gestion des erreurs

### Si l'indexation ElasticSearch échoue

```
❌ Indexation échoue
   ↓
❌ Validation annulée
   ↓
❌ Statut reste SUBMITTED (pas de changement)
   ↓
❌ Pas de notification envoyée
```

**Réponse HTTP 500** :
```json
{
  "detail": "Failed to index candidate in ElasticSearch. Validation cancelled. Error: ..."
}
```

### Si la mise à jour du statut échoue (après indexation réussie)

```
✅ Indexation réussie
   ↓
❌ Mise à jour du statut échoue
   ↓
⚠️ WARNING: Incohérence détectée
   ↓
❌ Validation annulée (mais l'indexation reste en place)
```

**Note** : Dans un système de production, il faudrait implémenter un mécanisme de rollback pour supprimer l'indexation en cas d'échec de la mise à jour du statut.

### Si la notification échoue

```
✅ Indexation réussie
   ↓
✅ Statut mis à jour
   ↓
❌ Notification échoue
   ↓
✅ Validation reste valide (la notification est non-critique)
```

## Exemple d'utilisation

### Requête

```http
POST /api/v1/admin/validate/123
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "overallScore": 4.5,
  "technicalSkills": 4.0,
  "softSkills": 4.5,
  "communication": 5.0,
  "motivation": 4.5,
  "softSkillsTags": ["leadership", "teamwork"],
  "interview_notes": "Excellent candidat avec une très bonne expérience...",
  "recommendations": "Recommandé pour poste senior",
  "summary": "Candidat très compétent avec une excellente expérience dans le domaine..."
}
```

### Réponse (succès)

```json
{
  "message": "Candidate profile validated successfully",
  "candidate_id": 123,
  "status": "VALIDATED",
  "indexed": true,
  "notification": "pending"
}
```

### Réponse (échec indexation)

```json
{
  "detail": "Failed to index candidate in ElasticSearch. Validation cancelled. Error: Connection timeout"
}
```

## Format des données indexées

Le service Admin formate les données du profil pour l'indexation :

```python
{
  "candidate_id": 123,
  "full_name": "John Doe",
  "title": "Ingénieur Génie Civil",
  "skills": [
    {"name": "Python", "level": "EXPERT"},
    {"name": "React", "level": "ADVANCED"}
  ],
  "years_of_experience": 10,
  "location": "Paris, France",
  "is_verified": true,
  "summary": "Ingénieur avec 10 ans d'expérience..."
}
```

## Notification email

La notification est envoyée avec les données suivantes :

```python
{
  "recipient_email": "candidate@example.com",
  "recipient_name": "John Doe",
  "template_data": {
    "recipient_name": "John Doe",
    "candidate_name": "John Doe",
    "profile_url": "http://localhost:3000/candidate/123"
  }
}
```

## Avantages de cette approche

1. **Cohérence garantie** : Si l'indexation échoue, le candidat n'est pas validé
2. **Performance** : La notification est asynchrone, ne bloque pas la réponse
3. **Simplicité** : Pas besoin de système de transaction distribué complexe (Saga, 2PC)
4. **Traçabilité** : Les erreurs sont loggées clairement

## Limitations

1. **Pas de rollback automatique** : Si la mise à jour du statut échoue après l'indexation, l'indexation reste en place
2. **Pas de retry automatique** : Les erreurs doivent être gérées manuellement
3. **Pas de compensation** : Pas de mécanisme pour annuler les opérations déjà effectuées

## Améliorations possibles

1. **Pattern Saga** : Implémenter un pattern Saga pour gérer les rollbacks
2. **Retry automatique** : Ajouter des mécanismes de retry pour les opérations critiques
3. **Queue de compensation** : Créer une queue pour les opérations de compensation
4. **Monitoring** : Ajouter des métriques pour suivre les échecs de validation

