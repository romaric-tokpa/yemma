# Guide d'Intégration - Onboarding Frontend/Backend

## Vue d'ensemble

Ce guide explique comment intégrer le processus d'onboarding frontend avec le service backend Candidate.

## Structure des données

### Format Frontend (steps)
Le frontend utilise un format avec des steps (step0, step1, step2, etc.) et des noms de champs en camelCase.

### Format Backend (API)
Le backend utilise des endpoints RESTful et des noms de champs en snake_case.

## Mapping des données

Un fichier utilitaire `frontend/src/utils/onboardingApiMapper.js` a été créé pour gérer la transformation des données.

### Étapes du processus

1. **Step 0 - Consentements** → `Profile.accept_cgu`, `accept_rgpd`, `accept_verification`
2. **Step 1 - Profil Général** → `Profile` (champs principaux)
3. **Step 2 - Expériences** → `Experience[]` (liste)
4. **Step 3 - Formations** → `Education[]` (liste)
5. **Step 4 - Certifications** → `Certification[]` (liste)
6. **Step 5 - Compétences** → `Skill[]` (liste)
7. **Step 6 - Documents** → Service Document (séparé)
8. **Step 7 - Préférences** → `JobPreference`

## Workflow d'intégration

### 1. Création du profil

Lors de la première connexion, créer le profil :

```javascript
import { candidateApi } from '@/services/api'
import { authApiService } from '@/services/api'

// Après connexion/inscription
const user = await authApiService.getCurrentUser()

// Créer le profil si n'existe pas
try {
  const profile = await candidateApi.getMyProfile()
  // Profil existe déjà
} catch (error) {
  if (error.response?.status === 404) {
    // Créer le profil
    await candidateApi.createProfile({
      email: user.email,
      user_id: user.id, // Sera remplacé par le backend depuis le token
    })
  }
}
```

### 2. Sauvegarde incrémentale

Pour chaque étape complétée :

```javascript
import { mapStep1ToBackend } from '@/utils/onboardingApiMapper'

// Exemple pour Step 1
const step1Data = form.getValues() // Données du formulaire
const backendData = mapStep1ToBackend(step1Data)

// Récupérer le profil ID
const profile = await candidateApi.getMyProfile()

// Mettre à jour
await candidateApi.updateProfile(profile.id, {
  ...backendData,
  last_step_completed: 1,
})
```

### 3. Sauvegarde des relations (expériences, formations, etc.)

Pour les étapes avec des listes (Step 2, 3, 4, 5) :

```javascript
import { mapStep2ToBackend } from '@/utils/onboardingApiMapper'

const step2Data = form.getValues()
const experiences = mapStep2ToBackend(step2Data)

const profile = await candidateApi.getMyProfile()

// Option 1: Supprimer toutes et recréer (simple)
const existingExperiences = await candidateApi.getExperiences(profile.id)
for (const exp of existingExperiences) {
  await candidateApi.deleteExperience(profile.id, exp.id)
}
for (const exp of experiences) {
  await candidateApi.createExperience(profile.id, exp)
}

// Option 2: Comparer et mettre à jour (plus complexe, à implémenter)
```

### 4. Soumission finale

Lors de la soumission (Step 8) :

```javascript
const profile = await candidateApi.getMyProfile()

// Sauvegarder toutes les données
await saveOnboardingProfile(profile.id, allFormData, candidateApi)

// Soumettre pour validation
await candidateApi.submitProfile(profile.id)
```

## Modification du composant OnboardingStepper

### Points à modifier

1. **Récupérer le profil au montage** :
```javascript
useEffect(() => {
  const loadProfile = async () => {
    try {
      const profile = await candidateApi.getMyProfile()
      // Charger les données existantes dans formData
      setFormData(transformBackendToFrontend(profile))
    } catch (error) {
      console.error('Erreur lors du chargement du profil', error)
    }
  }
  loadProfile()
}, [])
```

2. **Sauvegarde automatique améliorée** :
```javascript
const saveToAPI = useCallback(async (stepData, stepNumber) => {
  try {
    const profile = await candidateApi.getMyProfile()
    
    if (stepNumber === 0 || stepNumber === 1) {
      // Mettre à jour le profil
      const backendData = stepNumber === 0 
        ? mapStep0ToBackend(stepData)
        : mapStep1ToBackend(stepData)
      await candidateApi.updateProfile(profile.id, {
        ...backendData,
        last_step_completed: stepNumber,
      })
    } else if (stepNumber === 2) {
      // Gérer les expériences
      // ...
    }
    // etc.
  } catch (error) {
    console.error('Erreur lors de la sauvegarde', error)
  }
}, [])
```

3. **Soumission finale** :
```javascript
const handleSubmit = async () => {
  try {
    const profile = await candidateApi.getMyProfile()
    
    // Sauvegarder toutes les données
    await saveOnboardingProfile(profile.id, formData, candidateApi)
    
    // Soumettre
    await candidateApi.submitProfile(profile.id)
    
    // Rediriger vers une page de confirmation
    navigate('/onboarding/complete')
  } catch (error) {
    console.error('Erreur lors de la soumission', error)
    alert('Erreur lors de la soumission: ' + error.response?.data?.detail)
  }
}
```

## Endpoints API disponibles

### Profile
- `POST /api/v1/profiles` - Créer un profil
- `GET /api/v1/profiles/me` - Récupérer mon profil
- `GET /api/v1/profiles/{id}` - Récupérer un profil
- `PUT /api/v1/profiles/{id}` - Mettre à jour un profil
- `POST /api/v1/profiles/{id}/submit` - Soumettre pour validation

### Expériences
- `POST /api/v1/profiles/{id}/experiences` - Créer une expérience
- `GET /api/v1/profiles/{id}/experiences` - Lister les expériences
- `DELETE /api/v1/profiles/{id}/experiences/{exp_id}` - Supprimer une expérience

### Formations
- `POST /api/v1/profiles/{id}/educations` - Créer une formation
- `GET /api/v1/profiles/{id}/educations` - Lister les formations
- `DELETE /api/v1/profiles/{id}/educations/{edu_id}` - Supprimer une formation

### Certifications
- `POST /api/v1/profiles/{id}/certifications` - Créer une certification
- `GET /api/v1/profiles/{id}/certifications` - Lister les certifications
- `DELETE /api/v1/profiles/{id}/certifications/{cert_id}` - Supprimer une certification

### Compétences
- `POST /api/v1/profiles/{id}/skills` - Créer une compétence
- `GET /api/v1/profiles/{id}/skills` - Lister les compétences
- `DELETE /api/v1/profiles/{id}/skills/{skill_id}` - Supprimer une compétence

### Préférences
- `PUT /api/v1/profiles/{id}/job-preferences` - Créer/mettre à jour les préférences
- `GET /api/v1/profiles/{id}/job-preferences` - Récupérer les préférences

## Gestion des erreurs

- **401 Unauthorized** : Token expiré, rediriger vers login
- **404 Not Found** : Profil non trouvé, créer un nouveau profil
- **400 Bad Request** : Données invalides, afficher les erreurs de validation
- **403 Forbidden** : Permission refusée (ne devrait pas arriver pour son propre profil)

## Notes importantes

1. Le backend calcule automatiquement le `completion_percentage`
2. Le backend valide les données avant la soumission (minimum 70% de complétion)
3. Les documents (Step 6) sont gérés par le service Document séparément
4. L'étape 8 (Récapitulatif) est uniquement en lecture

## Prochaines étapes

1. Implémenter la fonction `transformBackendToFrontend` pour charger les données existantes
2. Améliorer la gestion des listes (expériences, etc.) avec comparaison intelligente
3. Ajouter la gestion des erreurs avec des toasts/notifications
4. Ajouter un indicateur de progression basé sur `completion_percentage` du backend

