# Parcours et architecture des services — Yemma Solutions

Document de référence décrivant les parcours candidat, recruteur et administrateur, les champs collectés, la logique métier, la structure des données et l'UX/UI.

---

## Table des matières

1. [Architecture globale et base de données](#1-architecture-globale-et-base-de-données)
2. [Service Candidat](#2-service-candidat)
3. [Service Recruteur (Company)](#3-service-recruteur-company)
4. [Service Administrateur](#4-service-administrateur)

---

## 1. Architecture globale et base de données

### 1.1 Services et bases de données

| Service | Base de données | Port |
|---------|-----------------|------|
| **Auth** | PostgreSQL (users, roles, user_roles, refresh_tokens) | 8001 |
| **Candidate** | PostgreSQL (profiles, experiences, educations, certifications, skills, job_preferences) | 8002 |
| **Company** | PostgreSQL (companies, team_members, invitations) | 8005 |
| **Admin** | Pas de BDD propre — orchestration des autres services | 8009 |
| **Search** | Elasticsearch (index certified_candidates) | 8004 |
| **Document** | PostgreSQL + MinIO (S3) | 8003 |
| **Parsing** | Pas de BDD — API HrFlow.ai | 8010 |

### 1.2 Schéma relationnel simplifié

```
[auth-service]
users (id, email, hashed_password, first_name, last_name, status, ...)
roles (id, name)
user_roles (user_id, role_id)
refresh_tokens (user_id, token, expires_at)

[candidate-service]
profiles (id, user_id, first_name, last_name, email, status, admin_score, ...)
experiences (id, profile_id, company_name, position, start_date, ...)
educations (id, profile_id, diploma, institution, graduation_year, ...)
certifications (id, profile_id, title, issuer, year, ...)
skills (id, profile_id, name, skill_type, level, ...)
job_preferences (id, profile_id, desired_positions, contract_types, ...)

[company-service]
companies (id, name, legal_id, admin_id, contact_email, ...)
team_members (id, user_id, company_id, role_in_company, status)
invitations (id, company_id, email, token, role, status, expires_at)
```

### 1.3 Rôles et flux

| Rôle | Service principal | Flux d'entrée |
|------|-------------------|---------------|
| **ROLE_CANDIDAT** | Candidate | Inscription → Onboarding → Soumission |
| **ROLE_COMPANY_ADMIN** | Company | Inscription → Onboarding entreprise → Gestion équipe |
| **ROLE_RECRUITER** | Company | Invitation → Acceptation → Recherche candidats |
| **ROLE_ADMIN / ROLE_SUPER_ADMIN** | Admin | Connexion → Validation / Rejet profils |

---

## 2. Service Candidat

### 2.1 Champs (données collectées)

#### Profil principal (`profiles`)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `user_id` | int | Oui | ID utilisateur (auth-service) |
| `first_name` | str | Oui* | Prénom |
| `last_name` | str | Oui* | Nom |
| `email` | str | Oui | Email |
| `phone` | str | Non | Téléphone |
| `address` | str | Non | Adresse |
| `city` | str | Oui* | Ville |
| `country` | str | Oui* | Pays |
| `date_of_birth` | datetime | Non | Date de naissance |
| `nationality` | str | Non | Nationalité |
| `profile_title` | str | Oui* | Titre du profil (ex: Développeur Full Stack) |
| `professional_summary` | str | Oui* | Résumé professionnel (min 300 caractères) |
| `sector` | str | Oui* | Secteur d'activité |
| `main_job` | str | Oui* | Métier principal |
| `total_experience` | int | Oui* | Années d'expérience |
| `photo_url` | str | Non | URL photo de profil |
| `status` | enum | Oui | DRAFT, SUBMITTED, IN_REVIEW, VALIDATED, REJECTED, ARCHIVED |
| `accept_cgu` | bool | Oui | Acceptation CGU |
| `accept_rgpd` | bool | Oui | Acceptation RGPD |
| `accept_verification` | bool | Oui | Autorisation vérification |

*Obligatoire pour soumission

#### Expériences (`experiences`)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `company_name` | str | Oui | Nom de l'entreprise |
| `position` | str | Oui | Poste occupé |
| `start_date` | datetime | Oui | Date de début |
| `end_date` | datetime | Non | Date de fin |
| `is_current` | bool | Non | Poste actuel |
| `description` | str | Oui* | Description des missions |
| `company_sector` | str | Non | Secteur de l'entreprise |

#### Formations (`educations`)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `diploma` | str | Oui | Intitulé du diplôme |
| `institution` | str | Oui | Établissement |
| `graduation_year` | int | Oui | Année d'obtention |
| `level` | str | Oui | Niveau (Bac, Bac+2, Bac+5, etc.) |

#### Certifications (`certifications`)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `title` | str | Oui | Intitulé |
| `issuer` | str | Oui | Organisme délivreur |
| `year` | int | Oui | Année d'obtention |

#### Compétences (`skills`)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `name` | str | Oui | Nom de la compétence |
| `skill_type` | enum | Oui | TECHNICAL, SOFT, TOOL |
| `level` | enum | Non | BEGINNER, INTERMEDIATE, ADVANCED, EXPERT |

#### Préférences emploi (`job_preferences`)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `desired_positions` | list[str] | Oui | Postes recherchés |
| `contract_types` | list[str] | Oui | CDI, CDD, FREELANCE, etc. |
| `availability` | str | Oui | Immédiate, 1 mois, etc. |
| `remote_preference` | str | Non | onsite, hybrid, remote, flexible |
| `preferred_locations` | str | Non | Zones géographiques |
| `willing_to_relocate` | bool | Non | Prêt à déménager |
| `salary_min` / `salary_max` | float | Non | Fourchette salariale (FCFA/mois) |

### 2.2 Logique (règles de validation, gestion d'erreurs, états)

#### Statuts du profil

| Statut | Description |
|--------|-------------|
| **DRAFT** | Brouillon — onboarding non terminé ou non soumis |
| **SUBMITTED** | Soumis pour validation |
| **IN_REVIEW** | En cours d'examen par un admin |
| **VALIDATED** | Validé — visible dans la CVthèque |
| **REJECTED** | Rejeté — motif communiqué au candidat |
| **ARCHIVED** | Archivé |

#### Règles de validation

- **Soumission** : `can_submit_profile()` vérifie que le profil est complet (profil général, au moins une expérience, une formation, une compétence technique, préférences emploi).
- **Création** : Si un profil existe déjà pour l'utilisateur, retour du profil existant (évite les doublons).
- **Mise à jour partielle** : `PartialProfileUpdateSchema` permet des mises à jour incrémentales par section.

#### Gestion d'erreurs

- `ProfileNotFoundError` → 404
- `ProfileAlreadyExistsError` → 409
- `InvalidProfileStatusError` → 400
- `ProfileNotCompleteError` → 400 (soumission)
- Validation Pydantic → 422

### 2.3 Structure (organisation des données)

#### Endpoints et routes

| Méthode | Route | Description | Rôle |
|---------|-------|-------------|------|
| POST | `/api/v1/profiles` | Créer un profil | CANDIDAT |
| POST | `/api/v1/profiles/from-cv` | Créer profil depuis CV (HrFlow) | CANDIDAT |
| GET | `/api/v1/profiles/me` | Récupérer mon profil (complet) | CANDIDAT |
| PATCH | `/api/v1/profiles/me` | Mise à jour partielle | CANDIDAT |
| POST | `/api/v1/profiles/me/notify-profile-created` | Notifier création | CANDIDAT |
| GET | `/api/v1/profiles` | Liste paginée (admin) | ADMIN |
| GET | `/api/v1/profiles/{id}` | Détail profil | ADMIN, RECRUTEUR |
| PUT | `/api/v1/profiles/{id}` | Mise à jour complète | ADMIN |
| POST | `/api/v1/profiles/{id}/submit` | Soumettre pour validation | CANDIDAT |
| POST | `/api/v1/profiles/{id}/experiences` | Ajouter expérience | CANDIDAT |
| GET | `/api/v1/profiles/{id}/experiences` | Liste expériences | CANDIDAT |
| DELETE | `/api/v1/profiles/{id}/experiences/{exp_id}` | Supprimer expérience | CANDIDAT |
| POST | `/api/v1/profiles/{id}/educations` | Ajouter formation | CANDIDAT |
| POST | `/api/v1/profiles/{id}/certifications` | Ajouter certification | CANDIDAT |
| POST | `/api/v1/profiles/{id}/skills` | Ajouter compétence | CANDIDAT |
| PUT | `/api/v1/profiles/{id}/job-preferences` | Mettre à jour préférences | CANDIDAT |
| GET | `/api/v1/profiles/stats` | Statistiques par statut | ADMIN |

### 2.4 UX/UI Design (interface candidat)

#### Parcours onboarding

1. **Étape 1 — Import CV** : Zone de dépôt (PDF/DOCX), blocs d'info (conseil + RGPD), bouton « Continuer → ».
2. **Étape 2 — Vérification** : Formulaire avec sections repliables (Identité, Expériences, Formations, Compétences, Certifications, Recherche d'emploi). Bouton « Créer mon profil ».
3. **Étape 3 — Succès** : Message de confirmation, bouton « Accéder à mon espace candidat ».

#### Charte graphique

- Couleurs : `#226D68` (vert principal), `#2C2C2C` (texte), `#6b7280` (secondaire), `#F4F6F8` (fond).
- Typographie : Sora pour les titres.
- Boutons : vert `#226D68`, hover `#1a5a55`.

#### Pages frontend

| Route | Page | Description |
|-------|------|-------------|
| `/onboarding` | CandidateOnboarding | Parcours d'onboarding (upload CV → révision → succès) |
| `/candidate/dashboard` | CandidateDashboard | Tableau de bord (statut, profil, documents) |
| `/candidate/profile/edit` | EditProfile | Édition du profil |

---

## 3. Service Recruteur (Company)

### 3.1 Champs (données collectées)

#### Entreprise (`companies`)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `name` | str | Oui | Nom de l'entreprise |
| `legal_id` | str | Oui | SIRET ou ID légal |
| `adresse` | str | Non | Adresse |
| `logo_url` | str | Non | URL du logo |
| `admin_id` | int | Oui | ID du compte admin (auth-service) |
| `contact_first_name` | str | Non | Prénom du référent |
| `contact_last_name` | str | Non | Nom du référent |
| `contact_email` | str | Non | Email du référent |
| `contact_phone` | str | Non | Téléphone du référent |
| `contact_function` | str | Non | Fonction du référent |

#### Membre d'équipe / Recruteur (`team_members`)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `user_id` | int | Oui | ID utilisateur (auth-service) |
| `company_id` | int | Oui | ID de l'entreprise |
| `role_in_company` | enum | Oui | ADMIN_ENTREPRISE ou RECRUTEUR |
| `status` | enum | Oui | ACTIVE, INACTIVE, PENDING |

#### Invitation (`invitations`)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `company_id` | int | Oui | ID de l'entreprise |
| `email` | str | Oui | Email invité |
| `first_name` | str | Non | Prénom |
| `last_name` | str | Non | Nom |
| `token` | str | Oui | Token unique |
| `role` | enum | Oui | Rôle assigné |

### 3.2 Logique (règles de validation, gestion d'erreurs, états)

#### Rôles

- **ADMIN_ENTREPRISE** : Crée l'entreprise, gère l'abonnement, invite des recruteurs, accède à la CVthèque.
- **RECRUTEUR** : Accès à la recherche et à la consultation des profils validés uniquement.

#### Invitations

- Token unique avec expiration (configurable).
- Statuts : PENDING, ACCEPTED, EXPIRED, CANCELLED.
- Acceptation : crée ou récupère l'utilisateur via auth-service, crée le TeamMember.

### 3.3 Structure (organisation des données)

#### Endpoints et routes

| Méthode | Route | Description | Rôle |
|---------|-------|-------------|------|
| POST | `/api/v1/companies` | Créer une entreprise | COMPANY_ADMIN |
| GET | `/api/v1/companies/me/company` | Mon entreprise | COMPANY_ADMIN |
| GET | `/api/v1/companies/{id}` | Détail entreprise | COMPANY_ADMIN |
| PUT | `/api/v1/companies/{id}` | Mettre à jour entreprise | COMPANY_ADMIN |
| GET | `/api/v1/companies/{id}/team-members` | Liste équipe + invitations | COMPANY_ADMIN |
| DELETE | `/api/v1/companies/{id}/team-members/{tm_id}` | Retirer un membre | COMPANY_ADMIN |
| POST | `/api/v1/invitations/invite` | Inviter un recruteur | COMPANY_ADMIN |
| GET | `/api/v1/invitations/company/{company_id}` | Liste invitations | COMPANY_ADMIN |
| POST | `/api/v1/invitations/accept-invite` | Accepter invitation | Invité |
| GET | `/api/v1/invitations/validate/{token}` | Valider token invitation | Public |
| GET | `/api/v1/recruiters/me` | Mon profil recruteur | RECRUTEUR |
| GET | `/api/v1/recruiters/company/{company_id}` | Liste recruteurs | COMPANY_ADMIN |
| DELETE | `/api/v1/recruiters/{id}` | Supprimer recruteur (soft) | COMPANY_ADMIN |
| POST | `/api/v1/recruiters/search/candidates` | Rechercher candidats | RECRUTEUR, COMPANY_ADMIN |

### 3.4 UX/UI Design (interface recruteur / entreprise)

#### Parcours entreprise

1. **Inscription** : RegisterCompany (nom, email, mot de passe, etc.).
2. **Onboarding entreprise** : CompanyOnboarding (nom, legal_id, adresse, contact).
3. **Dashboard** : CompanyDashboard (vue d'ensemble, équipe, recherche).

#### Parcours recruteur

1. **Invitation** : Email avec lien `/invitation/accept?token=...`.
2. **Acceptation** : AcceptInvitation (définir mot de passe).
3. **Recherche** : SearchPage, ProSearchPage (filtres, candidats validés).

#### Pages frontend

| Route | Page | Rôle |
|-------|------|------|
| `/company/onboarding` | CompanyOnboarding | COMPANY_ADMIN |
| `/company/dashboard` | CompanyDashboard | COMPANY_ADMIN, RECRUTEUR |
| `/company/dashboard?tab=management` | Gestion équipe | COMPANY_ADMIN |
| `/company/dashboard?tab=search` | Recherche candidats | RECRUTEUR, COMPANY_ADMIN |
| `/search` | SearchPage | RECRUTEUR, COMPANY_ADMIN |
| `/candidates/:id` | CandidateDetailPage | RECRUTEUR, COMPANY_ADMIN |
| `/invitation/accept` | AcceptInvitation | Invité |

---

## 4. Service Administrateur

### 4.1 Champs (données collectées)

Le service Admin n'a pas de base de données propre. Il récupère et met à jour les données via les services Candidate, Search, Payment, Notification, Audit.

#### Rapport de validation

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `overallScore` | float | Oui | Note globale (0–5) |
| `technicalSkills` | float | Non | Note compétences techniques |
| `softSkills` | float | Non | Note soft skills |
| `communication` | float | Non | Note communication |
| `motivation` | float | Non | Note motivation |
| `softSkillsTags` | list[str] | Non | Tags soft skills |
| `interview_notes` | str | Non | Notes d'entretien |
| `recommendations` | str | Non | Recommandations |
| `summary` | str | Oui | Résumé (min 50 caractères) |

#### Rapport de rejet

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `rejectionReason` | str | Oui | Motif (min 10 caractères) |
| `overallScore` | float | Non | Note globale |
| `interview_notes` | str | Non | Notes d'entretien |

### 4.2 Logique (règles de validation, gestion d'erreurs, états)

#### Validation

1. Récupération du profil candidat (Candidate Service).
2. Mise à jour du statut à `VALIDATED` + enregistrement du rapport admin.
3. Indexation dans ElasticSearch (Search Service).
4. Notification email au candidat (Notification Service).
5. En cas d'échec d'indexation : log dans Audit Service.

#### Rejet

1. Mise à jour du statut à `REJECTED` + motif.
2. Suppression de l'index de recherche (asynchrone).

#### Archivage

1. Mise à jour du statut à `ARCHIVED`.
2. Suppression de l'index de recherche (asynchrone).

### 4.3 Structure (organisation des données)

#### Endpoints et routes

| Méthode | Route | Description | Rôle |
|---------|-------|-------------|------|
| POST | `/api/v1/admin/validate/{candidate_id}` | Valider un profil | ADMIN, SUPER_ADMIN |
| POST | `/api/v1/admin/reject/{candidate_id}` | Rejeter un profil | ADMIN, SUPER_ADMIN |
| POST | `/api/v1/admin/archive/{candidate_id}` | Archiver un profil | ADMIN, SUPER_ADMIN |
| GET | `/api/v1/admin/evaluation/{candidate_id}` | Récupérer l'évaluation | ADMIN, SUPER_ADMIN |
| POST | `/api/v1/admin/index-cv/{candidate_id}` | Indexer un CV (CvGPT) | ADMIN, SUPER_ADMIN |
| POST | `/api/v1/admin/profile-ask/{candidate_id}` | Question IA (CvGPT) | ADMIN, SUPER_ADMIN |
| GET | `/api/v1/admin/stats/dashboard` | Statistiques dashboard | ADMIN, SUPER_ADMIN |

### 4.4 UX/UI Design (interface admin)

#### Pages frontend

| Route | Page | Description |
|-------|------|-------------|
| `/admin/dashboard` | AdminDashboard | Statistiques, vue d'ensemble |
| `/admin/cvtheque` | AdminCvtheque | Liste des profils par statut |
| `/admin/review/:id` | AdminReview | Fiche de validation/rejet |
| `/admin/invitations` | AdminInvitationsPage | Gestion des invitations admin |
| `/admin/create-account` | CreateAdminAccount | Création compte via token |

#### Interface de validation

- **Grille d'évaluation** : Notes (0–5) pour technique, soft skills, communication, motivation.
- **Résumé** : Champ obligatoire (min 50 caractères).
- **Recommandations** : Champ optionnel.
- **Boutons** : Valider / Rejeter.

---

## Annexes

### A. Schéma des flux principaux

```
CANDIDAT
  Inscription (auth) → Onboarding (candidate) → Soumission
  → Statut SUBMITTED → Admin examine → VALIDATED ou REJECTED
  → Si VALIDATED : indexation ElasticSearch, visible aux recruteurs

RECRUTEUR
  Invitation (company) → Acceptation (auth + company) → Connexion
  → Recherche (search) → Consultation profil (candidate)

ADMIN
  Connexion → CVthèque (candidate) → Fiche candidat
  → Validation (admin) → Mise à jour statut (candidate) + Indexation (search) + Notification
```

### B. Base de données PostgreSQL

Tous les services (auth, candidate, company, document, audit, payment) utilisent la même base PostgreSQL (`yemma_db`) avec des schémas/tables distincts par service. Les tables sont créées via SQLModel et Alembic.

### C. Index Elasticsearch

- **Index** : `certified_candidates`
- **Contenu** : Profils candidats avec statut VALIDATED uniquement.
- **Champs indexés** : profile_title, professional_summary, sector, main_job, skills, total_experience, admin_score, etc.

---

*Document généré à partir de l'analyse du codebase Yemma Solutions — Dernière mise à jour : 2025*
