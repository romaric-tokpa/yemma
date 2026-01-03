# Implémentation de l'Onboarding Candidat

## Vue d'ensemble

Cette implémentation permet une sauvegarde incrémentale du profil candidat à chaque étape de l'onboarding, avec validation stricte pour la soumission.

## Endpoint Principal

### PATCH /api/v1/profiles/me

**Description** : Met à jour partiellement le profil de l'utilisateur connecté (sauvegarde incrémentale)

**Authentification** : Requis (Bearer Token)

**Schéma de requête** : `PartialProfileUpdateSchema`

### Structure de la requête

```json
{
  "step0": {
    "accept_cgu": true,
    "accept_rgpd": true,
    "accept_verification": true
  },
  "step1": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+33123456789",
    "profile_title": "Ingénieur Génie Civil",
    "professional_summary": "Ingénieur avec 10 ans d'expérience...",
    "sector": "Construction",
    "main_job": "Ingénieur",
    "total_experience": 10
  },
  "step2": {
    "experiences": [
      {
        "company_name": "Acme Corp",
        "position": "Ingénieur Senior",
        "start_date": "2020-01-01T00:00:00Z",
        "end_date": null,
        "is_current": true,
        "has_document": true,
        "description": "Gestion de projets..."
      }
    ]
  },
  "step3": {
    "educations": [
      {
        "diploma": "Master en Génie Civil",
        "institution": "École Polytechnique",
        "graduation_year": 2014,
        "level": "Bac+5"
      }
    ]
  },
  "step4": {
    "certifications": [
      {
        "title": "PMP",
        "issuer": "PMI",
        "year": 2020
      }
    ]
  },
  "step5": {
    "technical_skills": [
      {
        "name": "Python",
        "level": "EXPERT",
        "years_of_practice": 5
      }
    ],
    "soft_skills": ["communication", "leadership"],
    "tools": [
      {
        "name": "AutoCAD",
        "level": "ADVANCED"
      }
    ]
  },
  "step7": {
    "contract_type": "CDI",
    "desired_location": "Paris",
    "availability": "Immediate",
    "salary_expectations": 60000
  },
  "last_step_completed": 7
}
```

### Comportement

- **Sauvegarde partielle** : Seules les étapes fournies sont mises à jour
- **Suppression et recréation** : Pour les étapes 2-5 (expériences, formations, certifications, compétences), les entités existantes sont supprimées et recréées
- **Recalcul automatique** : Le `completion_percentage` est recalculé après chaque mise à jour

## Calcul du Score de Complétion

### Algorithme pondéré

La fonction `calculate_completion_score()` (alias de `calculate_completion_percentage()`) calcule le score selon :

1. **Profil Général (Identité)** : 20%
   - Champs obligatoires : prénom, nom, email, date de naissance, nationalité, téléphone, adresse complète
   - Profil professionnel : titre, résumé (min 300 caractères), secteur, métier, expérience totale
   - Consentements : CGU, RGPD, vérification

2. **Expériences (min. 1 avec document)** : 30%
   - Au moins 1 expérience complète (entreprise, poste, dates)
   - Bonus si au moins 1 expérience a un document justificatif (+10%)
   - Bonus si au moins 2 expériences ont une description détaillée (+5%)
   - Score basé sur le nombre d'expériences :
     - 1 expérience = 50% de la section (15% du total)
     - 2 expériences = 75% de la section (22.5% du total)
     - 3+ expériences = 100% de la section (30% du total)

3. **Formations** : 15%
   - Score basé sur le nombre de formations complètes :
     - 1 formation = 60% de la section (9% du total)
     - 2+ formations = 100% de la section (15% du total)

4. **CV PDF (obligatoire)** : 25%
   - Si un CV PDF existe, la section est complète à 100% (25% du total)
   - Vérifié via le service Document

5. **Préférences** : 10%
   - Champs obligatoires : type de contrat, localisation, disponibilité, prétentions salariales
   - Champs optionnels : postes recherchés, secteurs ciblés, mobilité

**Total** : 100%

## Validation de Soumission

### Fonction `can_submit_profile()`

Le profil peut être soumis uniquement si :

1. **Score de complétion > 80%**
   ```python
   completion = calculate_completion_percentage(profile, has_cv=True)
   if completion < 80.0:
       return False, "Le profil n'est pas suffisamment complet (X% < 80%)"
   ```

2. **CV PDF présent (obligatoire)**
   ```python
   if not has_cv:
       return False, "Un CV PDF est obligatoire pour soumettre le profil"
   ```

3. **Au moins une expérience avec document justificatif**
   ```python
   if not has_experience_with_doc:
       return False, "Au moins une expérience professionnelle doit avoir un document justificatif"
   ```

4. **Tous les champs obligatoires remplis**
   - Consentements (Étape 0)
   - Identité complète (Étape 1)
   - Au moins une expérience complète (Étape 2)
   - Préférences complètes (Étape 7)

### Endpoint de soumission

**POST /api/v1/profiles/{profile_id}/submit**

- Vérifie automatiquement toutes les conditions via `can_submit_profile()`
- Change le statut de `DRAFT` → `SUBMITTED`
- Enregistre la date de soumission

## Schémas Pydantic par Étape

Tous les schémas sont définis dans `app/domain/onboarding_schemas.py` :

- `Step0ConsentSchema` : Consentements
- `Step1IdentitySchema` : Profil général / Identité
- `Step2ExperienceSchema` / `Step2ExperiencesSchema` : Expériences
- `Step3EducationSchema` / `Step3EducationsSchema` : Formations
- `Step4CertificationSchema` / `Step4CertificationsSchema` : Certifications
- `Step5TechnicalSkillSchema` / `Step5ToolSchema` / `Step5SkillsSchema` : Compétences
- `Step6DocumentsSchema` : Documents (métadonnées)
- `Step7PreferencesSchema` : Préférences
- `PartialProfileUpdateSchema` : Schéma unifié pour la sauvegarde partielle

## Exemple d'utilisation

### Sauvegarde de l'étape 1 uniquement

```http
PATCH /api/v1/profiles/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "step1": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+33123456789",
    "profile_title": "Ingénieur Génie Civil"
  },
  "last_step_completed": 1
}
```

### Sauvegarde de l'étape 2 uniquement

```http
PATCH /api/v1/profiles/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "step2": {
    "experiences": [
      {
        "company_name": "Acme Corp",
        "position": "Ingénieur Senior",
        "start_date": "2020-01-01T00:00:00Z",
        "is_current": true,
        "has_document": true
      }
    ]
  },
  "last_step_completed": 2
}
```

### Vérification avant soumission

```http
GET /api/v1/profiles/me
Authorization: Bearer <token>
```

Réponse :
```json
{
  "id": 123,
  "completion_percentage": 85.5,
  "status": "DRAFT",
  ...
}
```

Si `completion_percentage >= 80` et qu'un CV est présent, le bouton "Soumettre" peut être activé.

## Notes importantes

1. **Sauvegarde automatique** : Chaque étape peut être sauvegardée indépendamment
2. **Recalcul du score** : Le `completion_percentage` est recalculé après chaque mise à jour
3. **Validation stricte** : La soumission nécessite un score > 80% et un CV PDF
4. **Expérience avec document** : Au moins une expérience doit avoir un document justificatif
5. **Statut** : Seuls les profils en statut `DRAFT` ou `REJECTED` peuvent être modifiés

