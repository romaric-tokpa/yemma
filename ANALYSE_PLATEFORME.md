# Analyse Approfondie de la Plateforme Yemma Solutions

## Table des Matières

1. [Vue d'ensemble du Système](#vue-densemble-du-système)
2. [Architecture Microservices](#architecture-microservices)
3. [Flux Métier Détaillés](#flux-métier-détaillés)
4. [Services Backend - Analyse Technique](#services-backend---analyse-technique)
5. [Frontend - Interface Utilisateur](#frontend---interface-utilisateur)
6. [Infrastructure et Outils](#infrastructure-et-outils)
7. [Sécurité et Conformité](#sécurité-et-conformité)
8. [Patterns et Logique Métier](#patterns-et-logique-métier)

---

## Vue d'ensemble du Système

### Concept Métier

**Yemma Solutions** est une plateforme de recrutement innovante qui se distingue par son modèle de **validation humaine préalable** des profils candidats. Le concept central est le suivant :

1. **Candidats** créent et soumettent leur profil avec des documents justificatifs
2. **Administrateurs RH** (équipe interne Yemma) vérifient et valident chaque profil :
   - Vérification documentaire (CV, attestations, certificats)
   - Entretien téléphonique/visio
   - Évaluation structurée avec grilles de notation
3. **Profils validés** sont indexés et rendus visibles dans une CVthèque pour les recruteurs
4. **Entreprises/Recruteurs** accèdent uniquement à des profils certifiés, garantissant la qualité

### Acteurs et Rôles

- **CANDIDAT** : Personne recherchant un emploi, crée un profil détaillé
- **ROLE_ADMIN** : Équipe RH interne qui valide les profils
- **ROLE_SUPER_ADMIN** : Gestion technique et sécurité globale
- **ROLE_COMPANY_ADMIN** : Compte maître d'une entreprise (gère équipe, facturation)
- **ROLE_RECRUITER** : Sous-utilisateur rattaché à une entreprise, recherche des candidats

---

## Architecture Microservices

### Principes Architecturaux

La plateforme suit une **architecture microservices** avec les principes suivants :

1. **Séparation des responsabilités** : Chaque service a un domaine métier unique
2. **Autonomie des services** : Chaque service possède sa propre base de données (pattern Database per Service)
3. **Communication hybride** :
   - **Synchrone (HTTP/REST)** : Pour les opérations nécessitant une réponse immédiate
   - **Asynchrone (RabbitMQ - prévu)** : Pour les événements métier et opérations non-bloquantes
4. **API Gateway** : Point d'entrée unique (actuellement direct, prévu Nginx/Kong)
5. **Sécurité centralisée** : Service Auth comme source de vérité pour l'authentification

### Stack Technologique

- **Backend** : Python 3.11+, FastAPI, SQLModel, Alembic
- **Frontend** : React, Vite, TailwindCSS
- **Bases de données** : PostgreSQL 15+ (données relationnelles), ElasticSearch 8+ (recherche)
- **Stockage** : MinIO (dev) / S3 (prod) pour les documents
- **Cache** : Redis
- **Conteneurisation** : Docker, Docker Compose
- **Messaging** : RabbitMQ (prévu pour événements asynchrones)

---

## Flux Métier Détaillés

### 1. Flux d'Onboarding Candidat (Étapes 0-8)

Le processus d'onboarding est **séquentiel** et **progressif**, avec sauvegarde automatique :

#### Étape 0 : Conditions & Consentement
- Acceptation des CGU
- Consentement RGPD
- Autorisation de vérification des informations
- **Validation** : Case obligatoire cochée

#### Étape 1 : Profil Général
**Données collectées** :
- Informations d'identité (nom, prénom, date de naissance, nationalité, photo)
- Coordonnées (email, téléphone, adresse, ville, pays)
- Profil professionnel :
  - Titre du profil (ex: "Ingénieur Génie Civil")
  - Résumé professionnel (minimum 300 caractères)
  - Secteur(s) d'activité
  - Métier principal
  - Années d'expérience totale

**Logique** :
- Validation des champs obligatoires
- Calcul automatique des années d'expérience (si fourni)

#### Étape 2 : Expériences Professionnelles
**Structure** : Formulaire répétable (plusieurs expériences)

**Pour chaque expérience** :
- Logo entreprise (optionnel)
- Nom de l'entreprise (obligatoire)
- Secteur d'activité
- Poste occupé (obligatoire)
- Type de contrat (CDI, CDD, Stage, etc.)
- Date de début (obligatoire)
- Date de fin (ou "en cours")
- Description des missions (champs structurés mission par mission)
- Réalisations majeures
- Document justificatif (certificat, attestation, lettre de recommandation)
- Case à cocher : "Cette expérience est justifiable par un document"

**Logique métier** :
- Validation des dates (début < fin si non "en cours")
- Calcul automatique de la durée de chaque expérience
- Cumul automatique pour le total d'expérience

#### Étape 3 : Formations & Diplômes
**Structure** : Formulaire répétable

**Pour chaque formation** :
- Logo établissement (optionnel)
- Intitulé du diplôme/formation (obligatoire)
- Établissement (obligatoire)
- Pays
- Année de début
- Année d'obtention (obligatoire)
- Niveau (Bac, Bac+2, Bac+5, etc.) (obligatoire)

#### Étape 4 : Certifications & Attestations
**Structure** : Formulaire répétable

**Pour chaque certification** :
- Logo de la certification
- Intitulé (obligatoire)
- Organisme délivreur (obligatoire)
- Année d'obtention (obligatoire)
- Date d'expiration (si applicable)
- URL de vérification (optionnel)
- ID de la certification (optionnel)

#### Étape 5 : Compétences
**Trois catégories** :

1. **Compétences techniques** (formulaire répétable) :
   - Nom de la compétence (obligatoire)
   - Niveau (Débutant, Intermédiaire, Avancé, Expert) (obligatoire)
   - Années de pratique

2. **Compétences comportementales** (liste à choix multiples) :
   - Sélection depuis une liste prédéfinie (communication, leadership, rigueur, etc.)

3. **Outils & logiciels** (formulaire répétable) :
   - Nom de l'outil
   - Niveau de maîtrise

#### Étape 6 : Documents Justificatifs
**Documents obligatoires** :
- CV (PDF, obligatoire)

**Documents complémentaires** :
- Attestations de travail
- Certificats
- Lettres de recommandation

**Règles de validation** :
- Formats : PDF, JPG, PNG
- Taille max : 10 MB par fichier
- Prévisualisation avant validation
- Upload sécurisé avec validation par Magic Numbers

**Logique technique** :
- Upload vers MinIO/S3 avec nom unique (UUID)
- Organisation : `candidates/{candidate_id}/{document_type}/{filename}`
- Enregistrement en base avec métadonnées (taille, type MIME, statut)

#### Étape 7 : Recherche d'Emploi & Préférences
**Données collectées** :
- Poste(s) recherché(s) (maximum 5 postes)
- Type de contrat souhaité (obligatoire)
- Secteur(s) ciblé(s)
- Localisation souhaitée (obligatoire)
- Mobilité géographique
- Disponibilité (obligatoire)
- Prétentions salariales (obligatoire)

#### Étape 8 : Récapitulatif & Soumission
**Fonctionnalités** :
- Récapitulatif complet de toutes les étapes
- Bouton "Modifier une section" pour revenir en arrière
- Bouton "Soumettre mon profil pour validation"
- Message informatif : "Votre profil sera analysé par notre équipe RH avant publication"

**Logique de soumission** :
- Vérification de complétion minimale (champs obligatoires)
- Calcul de la jauge de complétion (%)
- Passage du statut : `DRAFT` → `SUBMITTED`
- Sauvegarde finale en base
- Déclenchement d'un événement (prévu RabbitMQ) pour notifier l'admin

**Jauge de complétion** :
- Algorithme calculant le pourcentage de remplissage
- Poids différents selon les sections (profil général plus important que certifications optionnelles)
- Affichage visuel de la progression

### 2. Flux de Validation Admin

#### Workflow de Validation

```
SUBMITTED → IN_REVIEW → VALIDATED ou REJECTED
```

#### Processus détaillé

1. **File de préqualification**
   - L'admin voit la liste des profils avec statut `SUBMITTED`
   - Tri par date de soumission (plus ancien en premier)
   - Interface "Tour de contrôle" avec statistiques

2. **Interface de validation (Split Screen)**
   - **À gauche** : Toutes les informations saisies par le candidat
   - **À droite** : Visionneuse de documents (zoom, rotation, navigation)
   - Actions disponibles :
     - "Valider la pièce" : Marquer un document comme vérifié
     - "Refuser la pièce" : Refuser avec motif
     - "Demander une nouvelle pièce" : Demander un nouveau document

3. **Vérification documentaire**
   - Pour chaque document :
     - Vérification de l'authenticité
     - Vérification de la cohérence avec les informations déclarées
     - Validation ou rejet avec commentaires

4. **Entretien (optionnel)**
   - Planification d'un entretien téléphonique/visio
   - Rédaction du compte rendu d'entretien

5. **Grille d'évaluation**
   - **Note globale** /5 (obligatoire)
   - **Compétences techniques** /5 (optionnel)
   - **Soft Skills** /5 (optionnel)
   - **Communication** /5 (optionnel)
   - **Motivation** /5 (optionnel)
   - **Tags soft skills** (liste) : leadership, teamwork, etc.
   - **Notes d'entretien** (texte libre)
   - **Recommandations** (texte libre)
   - **Résumé de l'évaluation** (minimum 50 caractères)

6. **Décision finale**
   - **VALIDATION** :
     - Statut → `VALIDATED`
     - Envoi asynchrone au service Search pour indexation
     - Envoi d'une notification au candidat
     - Le profil devient visible dans la CVthèque
   
   - **REJET** :
     - Statut → `REJECTED`
     - Motif du rejet (obligatoire)
     - Archivage (soft delete, conservé en base)
     - Suppression de l'index de recherche (si déjà indexé)
     - Envoi d'une notification au candidat avec les raisons
     - Possibilité de ré-soumission après délai (ex: 3 mois)

### 3. Flux de Recherche et Consultation

#### Recherche de Candidats

1. **Authentification recruteur**
   - Connexion avec rôle `ROLE_RECRUITER` ou `ROLE_COMPANY_ADMIN`
   - Vérification de l'abonnement actif de l'entreprise
   - Vérification des quotas disponibles

2. **Moteur de recherche ElasticSearch**
   - **Recherche full-text** sur :
     - Résumé professionnel (boost x3)
     - Titre du profil (boost x2)
     - Métier principal
     - Compétences (nested query)
   
   - **Filtres disponibles** :
     - Secteurs (facette)
     - Métiers (facette)
     - Années d'expérience (range)
     - Score admin minimum (range)
     - Compétences (nested query)
     - Types de contrat
     - Localisations
   
   - **Fonctionnalités** :
     - Recherche floue (fuzziness AUTO)
     - Highlight des termes recherchés
     - Tri par pertinence (score) ou par score admin
     - Pagination (20 résultats par page par défaut)

3. **Affichage des résultats**
   - **Carte candidat anonymisée ou non** (selon règles métier) :
     - Titre du profil
     - Résumé professionnel (tronqué à 200 caractères)
     - Secteur, métier
     - Années d'expérience
     - Score admin (badge "Vérifié")
     - Compétences principales
     - Score de pertinence

4. **Consultation d'un profil**
   - Vérification du quota disponible :
     - Plan Freemium : 10 consultations/mois
     - Plan Pro : Illimité
     - Plan Enterprise : Illimité
   
   - Si quota disponible :
     - Affichage du profil complet
     - Affichage du badge "Vérifié"
     - Section "L'avis de l'Expert" (compte rendu admin)
     - Accès aux documents (si plan Enterprise)
     - Décompte du quota (événement asynchrone)
     - Log d'accès (service Audit)
   
   - Si quota dépassé :
     - Message d'erreur
     - Proposition d'upgrade d'abonnement

### 4. Flux d'Abonnement et Paiement

#### Plans Disponibles

1. **Freemium** (0€/mois)
   - 10 consultations de profils/mois
   - Recherche limitée
   - Pas d'accès aux documents
   - Pas de multi-comptes

2. **Pro** (49.99€/mois ou 499.99€/an)
   - Consultations illimitées
   - Recherche illimitée
   - Pas d'accès aux documents
   - Pas de multi-comptes

3. **Enterprise** (199.99€/mois ou 1999.99€/an)
   - Consultations illimitées
   - Recherche illimitée
   - Accès aux documents
   - Multi-comptes recruteurs

#### Processus d'Abonnement

1. **Création d'une session de checkout Stripe**
   - L'entreprise sélectionne un plan et une période (mensuel/annuel)
   - Appel à `POST /api/v1/payments/create-checkout-session`
   - Création d'une session Stripe Checkout
   - Redirection vers l'URL Stripe

2. **Paiement Stripe**
   - L'utilisateur complète le paiement sur Stripe
   - Stripe envoie un webhook `checkout.session.completed`

3. **Traitement du webhook**
   - Vérification de la signature Stripe
   - Création de l'abonnement en base
   - Création du customer Stripe (si première fois)
   - Initialisation des quotas
   - Génération de la facture

4. **Activation de l'abonnement**
   - Statut → `active` ou `trialing`
   - Mise à jour de l'entreprise avec `subscription_id`
   - Notification à l'entreprise

#### Gestion des Quotas

- **Types de quotas** :
  - `profile_views` : Consultations de profils
  - `searches` : Recherches effectuées (si limité)
  
- **Décompte** :
  - À chaque consultation de profil, appel à `POST /api/v1/quotas/use`
  - Vérification avant chaque action : `POST /api/v1/quotas/check`
  - Si quota dépassé : refus de l'action + alerte
  
- **Renouvellement** :
  - Période : mensuelle ou annuelle selon plan
  - Réinitialisation automatique à chaque période
  - Webhook `invoice.paid` pour confirmer le paiement

### 5. Flux de Gestion d'Équipe

#### Invitation de Recruteurs

1. **Envoi d'invitation**
   - Le compte maître (`ROLE_COMPANY_ADMIN`) invite par email
   - Génération d'un token unique
   - Expiration : 48 heures
   - Enregistrement en base avec statut `pending`

2. **Acceptation de l'invitation**
   - Le recruteur reçoit un email avec lien d'invitation
   - Clic sur le lien → page d'acceptation
   - Création du compte utilisateur (si non existant)
   - Création du `TeamMember` avec statut `active`
   - Mise à jour de l'invitation (statut `accepted`)

3. **Gestion des membres**
   - Liste des recruteurs de l'entreprise
   - Suppression (soft delete) d'un recruteur
   - Vérification des permissions avant chaque action

---

## Services Backend - Analyse Technique

### 1. Auth Service (Port 8001)

**Responsabilité** : Gestion de l'identité et de l'accès (IAM)

#### Architecture

- **Pattern** : Architecture hexagonale (Clean Architecture)
- **Structure** :
  ```
  app/
  ├── api/v1/          # Couche API (endpoints FastAPI)
  ├── domain/          # Couche domaine (modèles, schémas, exceptions)
  ├── infrastructure/  # Couche infrastructure (DB, sécurité, repositories)
  └── core/            # Configuration et utilitaires
  ```

#### Modèles de Données

- **User** :
  - `id`, `email`, `hashed_password`
  - `first_name`, `last_name`
  - `status` (active, inactive, suspended)
  - `last_login`, `created_at`, `updated_at`
  
- **Role** :
  - `id`, `name` (ROLE_CANDIDAT, ROLE_COMPANY_ADMIN, etc.)
  - `description`
  
- **UserRoleLink** :
  - Association many-to-many entre User et Role
  
- **RefreshToken** :
  - `token`, `user_id`, `expires_at`
  - Permet le renouvellement des tokens JWT

#### Fonctionnalités Implémentées

1. **Inscription** (`POST /api/v1/auth/register`)
   - Validation des données (Pydantic)
   - Hashing du mot de passe (bcrypt)
   - Création de l'utilisateur
   - Assignation du rôle
   - Génération des tokens JWT (access + refresh)
   - Retour des tokens

2. **Connexion** (`POST /api/v1/auth/login`)
   - Vérification de l'email
   - Vérification du mot de passe
   - Vérification du statut (doit être `active`)
   - Récupération des rôles
   - Mise à jour de `last_login`
   - Génération des tokens
   - Retour des tokens

3. **Rafraîchissement de token** (`POST /api/v1/auth/refresh`)
   - Vérification du refresh token
   - Vérification de l'expiration
   - Génération d'un nouveau access token
   - Retour du nouveau token

4. **Gestion des utilisateurs**
   - `GET /api/v1/users/me` : Informations de l'utilisateur connecté
   - `GET /api/v1/users/{user_id}` : Récupérer un utilisateur (admin uniquement)
   - `PUT /api/v1/users/me` : Mettre à jour son profil

#### Sécurité

- **Hashing** : bcrypt avec salt automatique
- **JWT** : Tokens signés avec secret partagé
- **Expiration** : Access token (30 min par défaut), Refresh token (7 jours)
- **Validation** : Middleware OAuth2 pour vérifier les tokens

### 2. Candidate Service (Port 8002)

**Responsabilité** : Gestion des profils candidats

#### État Actuel

Le service est **en cours de développement**. La structure de base est présente mais l'implémentation complète de l'onboarding n'est pas encore finalisée.

#### Structure Prévue

- **Endpoints prévus** :
  - `POST /api/v1/profiles` : Créer un profil
  - `GET /api/v1/profiles/{id}` : Récupérer un profil
  - `PUT /api/v1/profiles/{id}` : Mettre à jour un profil
  - `POST /api/v1/profiles/{id}/submit` : Soumettre pour validation
  - `GET /api/v1/profiles/me` : Mon profil (candidat)

- **Modèles prévus** :
  - Profile (profil principal)
  - Experience (expériences professionnelles)
  - Education (formations)
  - Certification
  - Skill (compétences)
  - JobPreference (préférences de recherche)

#### Logique Métier

- **Statuts du profil** :
  - `DRAFT` : En cours de création
  - `SUBMITTED` : Soumis pour validation
  - `IN_REVIEW` : En cours de validation
  - `VALIDATED` : Validé et visible
  - `REJECTED` : Refusé (archivé)

- **Sauvegarde automatique** :
  - Toutes les 30 secondes (frontend)
  - À chaque changement d'étape
  - Avant soumission

- **Calcul de complétion** :
  - Algorithme pondéré selon l'importance des sections
  - Affichage en pourcentage

### 3. Admin Service (Port 8009)

**Responsabilité** : Workflow de validation et évaluation des profils

#### Architecture

Le service admin est un **orchestrateur** qui coordonne plusieurs services :
- **Candidate Service** : Récupération des profils
- **Search Service** : Indexation/désindexation
- **Notification Service** : Envoi de notifications

#### Endpoints Principaux

1. **Validation** (`POST /api/v1/admin/validate/{candidate_id}`)
   - Récupère le profil complet depuis Candidate Service
   - Prépare le rapport de validation
   - Met à jour le statut à `VALIDATED` dans Candidate Service
   - Déclenche l'indexation asynchrone dans Search Service
   - Retour immédiat (non-bloquant)

2. **Rejet** (`POST /api/v1/admin/reject/{candidate_id}`)
   - Met à jour le statut à `REJECTED`
   - Déclenche la suppression asynchrone de l'index
   - Retour immédiat

3. **Archivage** (`POST /api/v1/admin/archive/{candidate_id}`)
   - Met à jour le statut à `ARCHIVED`
   - Déclenche la suppression asynchrone de l'index

#### Rapport de Validation

Structure du rapport :
```json
{
  "overallScore": 4.5,           // Note globale /5 (obligatoire)
  "technicalSkills": 4.0,        // Optionnel
  "softSkills": 4.5,             // Optionnel
  "communication": 5.0,          // Optionnel
  "motivation": 4.5,             // Optionnel
  "softSkillsTags": ["leadership", "teamwork"],
  "interview_notes": "...",
  "recommendations": "...",
  "summary": "..."               // Minimum 50 caractères
}
```

#### Communication Inter-Services

- **Synchrone (HTTP)** :
  - Récupération du profil depuis Candidate Service
  - Mise à jour du statut dans Candidate Service
  
- **Asynchrone (BackgroundTasks)** :
  - Indexation dans Search Service
  - Suppression de l'index
  - Notifications (prévu)

### 4. Search Service (Port 8004)

**Responsabilité** : Moteur de recherche de profils avec ElasticSearch

#### Architecture

- **Client ElasticSearch** : Connexion asynchrone avec elasticsearch-py
- **Index** : `certified_candidates` (nom configurable)
- **Mapping** : Structure optimisée pour la recherche

#### Structure de l'Index ElasticSearch

```json
{
  "candidate_id": 123,
  "profile_title": "Ingénieur Génie Civil",
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe",
  "professional_summary": "...",
  "sector": "BTP",
  "main_job": "Ingénieur",
  "total_experience": 5,
  "admin_score": 4.5,
  "skills": [
    {
      "name": "Python",
      "level": "Avancé",
      "years_of_practice": 3
    }
  ],
  "contract_type": "CDI",
  "desired_location": "Paris, France",
  "is_verified": true,
  "validated_at": "2024-01-01T12:00:00Z"
}
```

#### Endpoints

1. **Recherche GET** (`GET /api/v1/search`)
   - Paramètres de requête pour filtres
   - Construction de la requête ElasticSearch
   - Exécution de la recherche
   - Agrégations (facettes) pour les filtres
   - Retour des résultats avec pagination

2. **Recherche POST** (`POST /api/v1/search`)
   - Body JSON avec requête structurée
   - Requête bool ElasticSearch (must + filter)
   - Highlight des termes recherchés
   - Plus performant pour recherches complexes

3. **Indexation** (`POST /api/v1/candidates/index`)
   - Appelé par Admin Service (asynchrone)
   - Création/mise à jour d'un document dans l'index
   - Mapping des données Candidate → ElasticSearch

4. **Désindexation** (`DELETE /api/v1/candidates/index/{candidate_id}`)
   - Appelé par Admin Service (asynchrone)
   - Suppression du document de l'index

#### Builder de Requêtes

- **SearchQueryBuilder** : Construit les requêtes GET
  - Multi-match pour recherche full-text
  - Filtres par facettes (terms)
  - Range pour expérience et score
  - Nested query pour compétences
  
- **PostSearchQueryBuilder** : Construit les requêtes POST
  - Bool query (must + filter)
  - Highlight configuration
  - Sorting et pagination

### 5. Document Service (Port 8003)

**Responsabilité** : Gestion sécurisée des documents

#### Architecture

- **Stockage** : MinIO (dev) / S3 (prod) via boto3
- **Base de données** : Métadonnées des documents (PostgreSQL)
- **Validation** : Magic Numbers pour sécurité

#### Modèle Document

- `id`, `candidate_id`, `document_type`
- `original_filename`, `stored_filename`
- `s3_key`, `file_size`, `mime_type`
- `status` (uploaded, verified, rejected)
- `created_at`, `deleted_at` (soft delete)

#### Types de Documents

- `CV` : Curriculum Vitae (obligatoire)
- `ATTESTATION` : Attestation de travail
- `CERTIFICATE` : Certificat
- `RECOMMENDATION_LETTER` : Lettre de recommandation
- `DIPLOMA` : Diplôme
- `OTHER` : Autre

#### Endpoints

1. **Upload** (`POST /api/v1/documents/upload`)
   - Validation du fichier (taille, extension, Magic Numbers)
   - Génération d'un nom unique (UUID)
   - Upload vers S3/MinIO
   - Enregistrement en base
   - Retour des métadonnées

2. **Visualisation** (`GET /api/v1/documents/view/{document_id}`)
   - Génération d'un lien présigné S3 (expiration 24h)
   - Retour de l'URL temporaire

3. **Liste** (`GET /api/v1/documents/candidate/{candidate_id}`)
   - Récupération de tous les documents d'un candidat
   - Filtrage par type (optionnel)

#### Validation des Fichiers

1. **Taille** : Maximum 10 MB
2. **Extension** : PDF, JPG, JPEG, PNG uniquement
3. **Magic Numbers** : Vérification du contenu réel
   - PDF : `%PDF` (bytes `\x25\x50\x44\x46`)
   - JPEG : `\xFF\xD8\xFF`
   - PNG : `\x89\x50\x4E\x47\x0D\x0A\x1A\x0A`
4. **Type MIME** : Vérification de cohérence extension/MIME

### 6. Company Service (Port 8005)

**Responsabilité** : Gestion des entreprises et équipes recruteurs

#### Modèles

1. **Company**
   - `id`, `name`, `legal_id` (SIRET, unique)
   - `address`, `logo_url`
   - `admin_id` (FK vers users, compte maître)
   - `subscription_id` (FK vers subscriptions)
   - `status` (active, suspended, inactive)

2. **TeamMember**
   - `id`, `user_id` (FK vers users)
   - `company_id` (FK vers companies)
   - `role_in_company` (ADMIN_ENTREPRISE, RECRUTEUR)
   - `status` (active, inactive, pending)
   - `joined_at`

3. **Invitation**
   - `id`, `company_id`, `email`
   - `token` (unique, pour acceptation)
   - `status` (pending, accepted, expired, cancelled)
   - `expires_at` (48 heures)
   - `invited_by`, `accepted_at`

#### Endpoints Principaux

1. **Entreprises**
   - `POST /api/v1/companies` : Créer une entreprise
   - `GET /api/v1/companies/{id}` : Récupérer une entreprise
   - `PUT /api/v1/companies/{id}` : Mettre à jour
   - `GET /api/v1/companies/me/company` : Mon entreprise

2. **Recruteurs**
   - `GET /api/v1/recruiters/company/{company_id}` : Liste des recruteurs
   - `GET /api/v1/recruiters/me` : Mon profil recruteur
   - `DELETE /api/v1/recruiters/{id}` : Supprimer un recruteur

3. **Invitations**
   - `POST /api/v1/invitations/invite` : Inviter un recruteur
   - `GET /api/v1/invitations/company/{company_id}` : Liste des invitations
   - `POST /api/v1/invitations/accept` : Accepter une invitation
   - `GET /api/v1/invitations/validate/{token}` : Valider un token

4. **Factures**
   - `GET /api/v1/company/{company_id}/invoices` : Factures (compte maître uniquement)

#### Permissions RBAC

- **require_company_admin** : Vérifie que l'utilisateur est admin de l'entreprise
- **require_recruiter_access** : Vérifie que l'utilisateur est recruteur actif
- **require_company_master** : Vérifie que l'utilisateur est le compte maître

#### Système d'Invitation

1. **Génération du token** :
   - Token unique basé sur email + company_id + timestamp
   - Signature avec secret partagé
   - Expiration : 48 heures

2. **Email d'invitation** (prévu) :
   - Lien avec token
   - Informations sur l'entreprise
   - Instructions d'acceptation

3. **Acceptation** :
   - Vérification du token (validité, expiration)
   - Création du compte utilisateur (si non existant)
   - Création du TeamMember
   - Mise à jour de l'invitation

### 7. Payment Service (Port 8006)

**Responsabilité** : Gestion des paiements et abonnements Stripe

#### Modèles

1. **Plan**
   - `id`, `name`, `plan_type` (FREEMIUM, PRO, ENTERPRISE)
   - `price_monthly`, `price_yearly`
   - `max_profile_views` (None = illimité)
   - `unlimited_search`, `document_access`, `multi_accounts` (booléens)
   - `stripe_price_id_monthly`, `stripe_price_id_yearly`

2. **Subscription**
   - `id`, `company_id`, `plan_id`
   - `status` (active, cancelled, past_due, unpaid, trialing)
   - `stripe_subscription_id`, `stripe_customer_id`
   - `current_period_start`, `current_period_end`

3. **Payment**
   - `id`, `subscription_id`, `amount`, `currency`
   - `status` (pending, succeeded, failed, refunded)
   - `stripe_payment_intent_id`, `stripe_checkout_session_id`
   - `paid_at`

4. **Invoice**
   - `id`, `payment_id`, `invoice_number`
   - `amount`, `currency`
   - `pdf_url` (généré automatiquement)

5. **Quota**
   - `id`, `subscription_id`, `quota_type` (profile_views, searches)
   - `limit`, `used`
   - `period_start`, `period_end`

#### Endpoints

1. **Plans**
   - `GET /api/v1/plans` : Liste des plans actifs
   - `GET /api/v1/plans/{plan_id}` : Détails d'un plan

2. **Abonnements**
   - `GET /api/v1/subscriptions/company/{company_id}` : Abonnement d'une entreprise

3. **Paiements**
   - `POST /api/v1/payments/checkout` : Créer une session Stripe Checkout
   - Body : `company_id`, `plan_id`, `billing_period` (monthly/yearly)

4. **Webhooks**
   - `POST /api/v1/webhooks/stripe` : Webhook Stripe
   - Événements gérés :
     - `checkout.session.completed` : Crée l'abonnement
     - `invoice.paid` : Met à jour le paiement et génère facture
     - `customer.subscription.updated` : Met à jour l'abonnement
     - `customer.subscription.deleted` : Annule l'abonnement

5. **Quotas**
   - `POST /api/v1/quotas/check` : Vérifier un quota
   - `POST /api/v1/quotas/use` : Utiliser un quota (décrémenter)

#### Intégration Stripe

1. **Création de session Checkout** :
   - Récupération du plan (price_id Stripe)
   - Création de la session Stripe
   - Métadonnées : company_id, plan_id
   - URLs de succès/annulation

2. **Traitement des webhooks** :
   - Vérification de la signature Stripe
   - Parsing de l'événement
   - Mise à jour en base selon l'événement
   - Génération de facture (si paiement réussi)

3. **Gestion des quotas** :
   - Initialisation à la création de l'abonnement
   - Vérification avant chaque action
   - Décrémentation après utilisation
   - Réinitialisation à chaque période

#### Seed des Plans

À l'initialisation, création automatique des 3 plans :
- Freemium (plan_type: FREEMIUM)
- Pro (plan_type: PRO)
- Enterprise (plan_type: ENTERPRISE)

### 8. Notification Service (Port 8007)

**Responsabilité** : Envoi de notifications (email, in-app)

#### Architecture

- **BackgroundTasks FastAPI** : Tâches asynchrones pour l'envoi
- **Providers** : SMTP, SendGrid, Mailgun (configurables)
- **Templates HTML** : Templates d'emails professionnels

#### Modèle Notification

- `id`, `notification_type`, `recipient_email`, `recipient_name`
- `template_data` (JSON)
- `status` (pending, sent, failed)
- `sent_at`, `error_message`

#### Types de Notifications

1. **welcome_candidate** : Bienvenue (Candidat)
2. **profile_validated** : Profil Validé (Candidat)
3. **profile_rejected** : Profil Refusé (Candidat)
4. **recruiter_invitation** : Nouvelle invitation d'équipe (Recruteur)
5. **quota_alert** : Alerte de quota d'abonnement atteint (Entreprise)

#### Endpoints

- `POST /api/v1/notifications/send` : Envoi générique
- `POST /api/v1/notifications/send/welcome-candidate` : Bienvenue candidat
- `POST /api/v1/notifications/send/profile-validated` : Profil validé
- `POST /api/v1/notifications/send/profile-rejected` : Profil refusé
- `POST /api/v1/notifications/send/recruiter-invitation` : Invitation recruteur
- `POST /api/v1/notifications/send/quota-alert` : Alerte quota

#### Processus d'Envoi

1. **Création de la notification** :
   - Enregistrement en base avec statut `pending`
   - Données du template stockées en JSON

2. **Tâche asynchrone** :
   - Récupération du template (HTML + texte)
   - Remplacement des variables (template_data)
   - Envoi via le provider configuré
   - Mise à jour du statut (`sent` ou `failed`)

3. **Gestion des erreurs** :
   - Logging des erreurs
   - Statut `failed` en base
   - Message d'erreur stocké

### 9. Audit Service (Port 8008)

**Responsabilité** : Traçabilité et journalisation (Conformité RGPD)

#### Modèle AccessLog

- `id`, `recruiter_id`, `recruiter_email`, `recruiter_name`
- `company_id`, `company_name`
- `candidate_id`, `candidate_email`, `candidate_name`
- `access_type` (profile_view, document_access, etc.)
- `ip_address`, `user_agent`
- `accessed_at`

#### Endpoints

- `POST /api/v1/audit` : Enregistrer un accès
- `GET /api/v1/audit/{log_id}` : Récupérer un log
- `GET /api/v1/audit` : Lister les logs (avec filtres)
- `GET /api/v1/audit/candidate/{candidate_id}` : Logs d'un candidat (RGPD)
- `GET /api/v1/audit/recruiter/{recruiter_id}` : Logs d'un recruteur
- `GET /api/v1/audit/company/{company_id}` : Logs d'une entreprise
- `GET /api/v1/audit/stats/summary` : Statistiques d'accès

#### Conformité RGPD

- **Article 15 (Droit à l'information)** : Les candidats peuvent consulter qui a accédé à leur profil
- **Article 17 (Droit à l'effacement)** : Possibilité d'anonymisation/suppression (selon politique de rétention)
- **Traçabilité complète** : Tous les accès sont enregistrés avec identité, date, contexte

#### Intégration

Lorsqu'un recruteur consulte un profil, le service appelant doit :
1. Vérifier le quota (Payment Service)
2. Afficher le profil
3. Enregistrer l'accès (Audit Service)
4. Décrémenter le quota (Payment Service)

---

## Frontend - Interface Utilisateur

### Architecture Frontend

- **Framework** : React 18+
- **Build Tool** : Vite
- **Styling** : TailwindCSS
- **Routing** : React Router
- **Form Management** : React Hook Form + Zod (validation)
- **HTTP Client** : Axios (via service API)

### Structure des Pages

1. **Page d'accueil** (`/`)
   - Liste des services disponibles
   - Liens vers la documentation API

2. **Onboarding Candidat** (`/onboarding`)
   - Stepper avec 9 étapes (0-8)
   - Barre de progression
   - Sauvegarde automatique
   - Navigation avant/arrière

3. **Recherche** (`/search`)
   - Barre de recherche full-text
   - Sidebar avec filtres
   - Grille de résultats (cartes candidats)
   - Pagination

4. **Recherche Pro** (`/search/pro`)
   - Interface avancée pour recruteurs
   - Filtres étendus
   - Résultats détaillés

5. **Détail Candidat** (`/candidates/:candidateId`)
   - Profil complet
   - Badge "Vérifié"
   - Section "Avis de l'Expert"
   - Documents (si Enterprise)

6. **Admin Review** (`/admin/review/:candidateId`)
   - Split screen (données / documents)
   - Grille d'évaluation
   - Actions de validation/rejet

7. **Gestion Entreprise** (`/company/management`)
   - Informations de l'entreprise
   - Gestion des recruteurs
   - Invitations
   - Abonnement et factures

### Composants Clés

1. **OnboardingStepper**
   - Gestion de l'état des étapes
   - Sauvegarde automatique (30 secondes)
   - Validation avec Zod
   - Navigation entre étapes

2. **SearchSidebar**
   - Filtres par facettes
   - Mise à jour dynamique des filtres
   - Affichage des compteurs

3. **CandidateCard**
   - Carte de résultat de recherche
   - Informations essentielles
   - Badge de vérification
   - Score admin

4. **DocumentViewer**
   - Visualisation de documents (PDF, images)
   - Zoom, rotation
   - Navigation entre documents

---

## Infrastructure et Outils

### Bases de Données

1. **PostgreSQL 15+**
   - Base de données principale pour tous les services (sauf Search)
   - Pattern Database per Service (prévu, actuellement partagée)
   - Migrations avec Alembic

2. **ElasticSearch 8+**
   - Index `certified_candidates`
   - Recherche full-text et facettes
   - Pas de sécurité activée en dev (facilite l'intégration)

3. **Redis**
   - Cache (prévu)
   - Sessions (prévu)
   - Rate limiting (prévu)

### Stockage

- **MinIO** (dev) / **AWS S3** (prod)
- Bucket : `documents`
- Organisation : `candidates/{candidate_id}/{document_type}/{filename}`
- Liens présignés pour accès temporaire

### Monitoring et Observabilité

- **Kibana** : Visualisation ElasticSearch (port 5601)
- **Health checks** : Endpoint `/health` sur chaque service
- **Logs** : Format structuré (prévu JSON)

### Docker Compose

- **Réseau** : `yemma-network` (bridge)
- **Volumes** : Persistance des données (postgres, redis, minio, elasticsearch)
- **Dépendances** : Services déclarent leurs dépendances (depends_on)
- **Health checks** : Vérification automatique de l'état

---

## Sécurité et Conformité

### Authentification et Autorisation

- **JWT** : Tokens signés avec secret partagé
- **OAuth2** : Flux standard (password grant)
- **RBAC** : Rôles et permissions granulaires
- **Validation inter-services** : Tokens JWT pour communication interne

### Sécurité des Données

- **Mots de passe** : Hashing bcrypt avec salt
- **Documents** : Validation par Magic Numbers, chiffrement au repos (prévu)
- **Liens présignés** : Accès temporaire (24h par défaut)
- **CORS** : Configuration par service (à restreindre en production)

### Conformité RGPD

- **Traçabilité** : Service Audit pour tous les accès
- **Droit à l'information** : Candidats peuvent voir qui a consulté leur profil
- **Droit à l'effacement** : Soft delete avec possibilité d'anonymisation
- **Consentement** : Collecte explicite lors de l'onboarding

### Bonnes Pratiques

- **Validation des données** : Pydantic pour backend, Zod pour frontend
- **Gestion des erreurs** : Exceptions personnalisées avec codes HTTP appropriés
- **Logging** : Logs structurés (prévu)
- **Secrets** : Variables d'environnement (pas de secrets en dur)

---

## Patterns et Logique Métier

### Patterns Architecturaux

1. **Clean Architecture** (Auth Service)
   - Séparation des couches (API, Domain, Infrastructure)
   - Indépendance du framework
   - Testabilité

2. **Repository Pattern**
   - Abstraction de l'accès aux données
   - Réutilisabilité
   - Testabilité

3. **Dependency Injection**
   - FastAPI Depends()
   - Injection des dépendances (DB, Auth, etc.)

4. **Background Tasks**
   - Opérations asynchrones non-bloquantes
   - FastAPI BackgroundTasks

### Communication Inter-Services

1. **Synchrone (HTTP/REST)**
   - Utilisé pour opérations nécessitant une réponse immédiate
   - Exemples :
     - Récupération d'un profil (Admin → Candidate)
     - Vérification de quota (Search → Payment)
     - Validation JWT (tous → Auth)

2. **Asynchrone (BackgroundTasks)**
   - Utilisé pour opérations non-bloquantes
   - Exemples :
     - Indexation (Admin → Search)
     - Notifications (Admin → Notification)
     - Désindexation (Admin → Search)

3. **Asynchrone (RabbitMQ - prévu)**
   - Événements métier
   - Découplage fort
   - Exemples prévus :
     - `profile.submitted` → Admin Service
     - `profile.validated` → Search Service, Notification Service
     - `profile.viewed` → Audit Service, Payment Service

### Gestion des États

1. **Statuts de Profil**
   - Machine à états : DRAFT → SUBMITTED → IN_REVIEW → VALIDATED/REJECTED
   - Transitions contrôlées
   - Validation des transitions

2. **Statuts d'Abonnement**
   - Stripe gère les statuts (active, cancelled, past_due, etc.)
   - Synchronisation via webhooks

3. **Statuts d'Invitation**
   - pending → accepted/expired/cancelled
   - Expiration automatique (48h)

### Logique Métier Spécifique

1. **Calcul de Complétion**
   - Algorithme pondéré par section
   - Sections obligatoires plus lourdes
   - Affichage en pourcentage

2. **Gestion des Quotas**
   - Vérification avant action
   - Décrémentation après action
   - Réinitialisation périodique
   - Alerte si seuil atteint

3. **Indexation ElasticSearch**
   - Mapping des données Candidate → ElasticSearch
   - Transformation des structures
   - Gestion des nested fields (compétences)

4. **Validation des Documents**
   - Multi-niveaux (taille, extension, Magic Numbers, MIME)
   - Sécurité renforcée
   - Prévisualisation avant upload

---

## Conclusion

La plateforme Yemma Solutions est une **application microservices complexe** avec une architecture bien pensée, suivante les meilleures pratiques :

- **Séparation des responsabilités** : Chaque service a un rôle clair
- **Scalabilité** : Services indépendants, scalable séparément
- **Sécurité** : JWT, RBAC, validation stricte
- **Conformité** : RGPD intégré dès la conception
- **Expérience utilisateur** : Onboarding progressif, recherche avancée
- **Qualité** : Validation humaine préalable garantit la qualité des profils

Le système est **en cours de développement** avec une base solide déjà en place. Les services principaux (Auth, Admin, Search, Document, Company, Payment, Notification, Audit) sont implémentés avec leurs fonctionnalités core, tandis que le service Candidate nécessite encore l'implémentation complète de l'onboarding.

La communication inter-services est bien pensée avec un mélange de synchrone (pour réponses immédiates) et asynchrone (pour opérations non-bloquantes), avec une évolution prévue vers RabbitMQ pour les événements métier.

