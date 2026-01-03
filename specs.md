📄 Cahier des Charges : Plateforme de Recrutement "Certifiée"
1. Présentation du Projet
Le marché du recrutement est confronté à une surcharge de candidatures peu qualifiées et à une faible fiabilité des informations fournies par les candidats. Les recruteurs perdent du temps à trier, vérifier et évaluer les profils.
1.1. Objectif
Développer une plateforme web de mise en relation entre candidats et recruteurs, avec un rôle central d'Administrateur agissant comme tiers de confiance. La plateforme se distingue par la validation humaine des profils (vérification documentaire + entretien) avant leur mise en ligne.
Créer une plateforme de recrutement professionnelle reposant sur une CVthèque de profils préqualifiés, où :
les candidats valorisent leur profil avec preuves à l’appui,
les entreprises accèdent uniquement à des profils validés,
une équipe RH interne joue le rôle de tiers de confiance.
La plateforme est une application web développée en architecture microservices, évolutive, sécurisée et scalable.
1.2. Acteurs
Candidat : Cherche à valoriser son profil par un label de qualité.
Entreprise (Compte Maître) : Gère la facturation et les accès de son équipe.
Recruteur (Sous-utilisateur) : Cherche des candidats, consulte les comptes rendus d'entretien.
Administrateur (Super-Admin & Modérateurs) : Vérifie, audite, valide les profils et gère la plateforme.
2. Architecture Technique (Microservices)
L'application sera découpée en services autonomes pour assurer la scalabilité et la maintenance.
2.1. Liste des Microservices
Service Auth (Identity & Access Management) : Gestion des connexions, inscriptions, rôles (RBAC), tokens JWT.
Service Candidat (Profile Manager) : Gestion des données personnelles, CV, expériences, compétences.
Service Documents (Vault) : Stockage sécurisé des preuves (PDF, IMG), scan antivirus, génération de liens temporaires.
Service Admin (Workflow & Assessment) : Logique de validation, grilles d'évaluation, comptes rendus d'entretien, gestion des statuts.
Service Entreprise (Company & Team) : Gestion des entités légales, gestion des équipes recruteurs, abonnements.
Service Recherche (Search Engine) : Indexation des profils validés pour une recherche rapide (ElasticSearch).
Service Logs & Audit : Traçabilité de toutes les actions (pour l'admin).
Service Notification : Envoi d'emails transactionnels et alertes in-app.
Subscription Service (abonnements)
Payment Service
2.2. Stack Technologique Suggérée
Backend : FastAPI 
Frontend : React.js ou Vue.js (SPA).
API Gateway : Kong ou Nginx (Routeur central).
Base de Données par service :
PostgreSQL (Données relationnelles : Utilisateurs, Abonnements).
MongoDB (Données non structurées : Logs, formulaires d'évaluation).
ElasticSearch (Moteur de recherche).
Stockage Fichiers : AWS S3 ou MinIO.
Communication Inter-services : RabbitMQ ou Kafka (Asynchrone) + REST/gRPC (Synchrone).
Conteneurisation : Docker + Kubernetes.

Composant
Technologie
Justification
Langage
Python 3.10+
Typage fort, écosystème riche.
Framework API
FastAPI
Validation des données (Pydantic), Docs auto (OpenAPI), Async.
Base de Données
PostgreSQL 15+
Fiabilité, gestion du JSONB (pour les logs/skills), Recherche Full-Text.
ORM / Driver
SQLModel (ou SQLAlchemy)
Combine Pydantic et SQLAlchemy. Idéal pour FastAPI.
Migrations
Alembic
Pour gérer les évolutions du schéma de base de données sans perte de données.
Sécurité
OAuth2 + JWT (Jose)
Standard pour l'authentification stateless entre microservices.
Conteneurisation
Docker & Docker Compose
Pour orchestrer les différents services et la DB.

3. Spécifications Fonctionnelles Détaillées
3.1. Service Auth (Authentification)
Inscription : Formulaires distincts (Candidat / Entreprise):
Fonctionnalités
Inscription candidat (email + validation)
Inscription entreprise (validation)
Connexion sécurisée
Réinitialisation mot de passe
Gestion des rôles et permissions
Journal des connexions
Login : Email/Mot de passe, ou LinkedIn OAuth.
Gestion des Rôles :
ROLE_CANDIDAT (Personne physique à la recherche d’opportunités professionnelles.)
ROLE_COMPANY_ADMIN (Organisation cliente ayant accès à la CVthèque.Peut payer, inviter des recruteurs)
ROLE_RECRUITER (Peut chercher, voir les profils, Sous-utilisateur rattaché à une entreprise.)
ROLE_ADMIN (Équipe RH chargée de la préqualification et de la gestion globale.)
ROLE_SUPER_ADMIN (Gestion technique, sécurité et paramétrage global.)
3.2. Service Candidat & Documents
Création du Profil :
Le candidat crée son profil via un processus d’onboardin(Profil général, expériences, formations, certifications, compétences, documents, recherches d’emploi).
FORMULAIRE D’ONBOARDING – CRÉATION DE PROFIL CANDIDAT
Objectif
Guider le candidat pas à pas dans la création d’un profil structuré, complet et exploitable, facilitant la préqualification par l’administrateur et la lisibilité pour les recruteurs.
Le processus d’onboarding est découpé en étapes successives, avec sauvegarde automatique et indicateur de progression.
ÉTAPE 0 – CONDITIONS & CONSENTEMENT
Acceptation des Conditions Générales d’Utilisation


Consentement au traitement des données personnelles (RGPD)


Autorisation de vérification des informations fournies


☑ Case obligatoire pour continuer
ÉTAPE 1 – PROFIL GÉNÉRAL
Informations d’identité
Photo de profil
Nom *


Prénom *


Date de naissance *


Sexe (optionnel)


Nationalité *


Coordonnées
Email * (prérempli si inscrit)


Téléphone *


Adresse / Ville *


Pays *


Profil professionnel
Titre du profil (ex : Ingénieur Génie Civil – TP) *


Résumé professionnel (min. 300 caractères) *


Secteur(s) d’activité * (liste déroulante)


Métier principal *


Années d’expérience totale *


ÉTAPE 2 – EXPÉRIENCES PROFESSIONNELLES
(Formulaire répétable – possibilité d’ajouter plusieurs expériences)
Pour chaque expérience :
Logo de l’entreprise
Nom de l’entreprise *


Secteur d’activité


Poste occupé *


Type de contrat


Date de début *


Date de fin (ou « en cours »)


Description des missions * (champs d’ajout mission par missions


Réalisations majeures (champ structuré)
Document justificatif d’expérience (Certificat ou attestation de travail, lettre de recommandation en pdf ou word)


☑ Case : « Cette expérience est justifiable par un document »

ÉTAPE 3 – FORMATIONS & DIPLÔMES
(Formulaire répétable)
Pour chaque formation :
Logo  de l’établissement
Intitulé du diplôme / formation *


Établissement *


Pays


Année de début


Année d’obtention *


Niveau (Bac, Bac+2, Bac+5, etc.) *



ÉTAPE 4 – CERTIFICATIONS & ATTESTATIONS
(Formulaire répétable)
logo de la certification
Intitulé de la certification *


Organisme délivreur *


Année d’obtention *


Date d’expiration (si applicable)
URL de vérification
ID de la certification



ÉTAPE 5 – COMPÉTENCES
Compétences techniques
(Formulaire répétable)
Compétence * (champs d’ajout compétences par compétences)


Niveau (Débutant / Intermédiaire / Avancé / Expert) *


Années de pratique


Compétences comportementales
Liste à choix multiples (communication, leadership, rigueur, etc.)


Outils & logiciels
Nom de l’outil


Niveau de maîtrise



ÉTAPE 6 – DOCUMENTS JUSTIFICATIFS
Documents obligatoires
CV (PDF – obligatoire) *


Documents complémentaires
Attestations de travail


Certificats


Lettres de recommandation


Règles :
Formats autorisés : PDF, JPG, PNG


Taille max par fichier configurable


Prévisualisation avant validation


ÉTAPE 7 – RECHERCHE D’EMPLOI & PRÉFÉRENCES
Poste(s) recherché(s) * (peux renseigné au maximum 5 postes)


Type de contrat souhaité *


Secteur(s) ciblé(s)


Localisation souhaitée *


Mobilité géographique


Disponibilité *


Prétentions salariales*


ÉTAPE 8 – RÉCAPITULATIF & SOUMISSION
Récapitulatif complet du profil


Bouton : « Modifier une section »


Bouton : « Soumettre mon profil pour validation »


⚠ Message d’information :
« Votre profil sera analysé par notre équipe RH avant publication dans la CVthèque. »

EXIGENCES UX / TECHNIQUES
Barre de progression


Sauvegarde automatique


Possibilité de reprendre plus tard


Validation des champs obligatoires


Responsive (mobile / desktop)


Multilingue (évolutif)



Fin du formulaire d’onboarding candidat

Jauge de complétion : Algorithme calculant le % de remplissage.
Soumission : Bouton "Soumettre pour validation".
État du profil : DRAFT -> SUBMITTED -> IN_REVIEW -> VALIDATED ou REJECTED.
3.3. Service Admin (Le Cœur du Système)
Dashboard "Tour de Contrôle" :
Vue des profils en attente (tri par date de soumission).
Vue des logs globaux (qui a fait quoi).
Interface de Validation (Split Screen) :
À gauche : Les infos saisies par le candidat.
À droite : La visionneuse de documents (zoom, rotation).
Actions : "Valider la pièce", "Refuser la pièce (avec motif)", "Demander une nouvelle pièce".
Module d'Entretien :
Formulaire dynamique (Grille d'évaluation configurée par l'admin).
Champs : Note /5, Soft Skills (Tags), Résumé écrit (Rich Text).
Logique de Validation Finale :
Si Validé : Le profil est envoyé au Service Recherche et devient visible.
Si Refusé : Le profil passe en statut REJECTED. Il est retiré de la recherche mais conservé en "Cold Storage" (archivage). Le candidat reçoit un email avec les raisons. Possibilité de ré-soumission après délai (ex: 3 mois).
3.4. Service Entreprise & Recherche
Gestion d'équipe : Le Compte Maître invite des emails pro. Chaque invité crée son mot de passe.
Moteur de Recherche :
Filtres : Compétences, Années d'expérience, Secteur, Note de l'Admin.
Affichage des résultats : "Cartes Candidats" anonymisées ou non (selon règles métier).
Fiche Candidat Vue Recruteur :
Affichage du "Badge Vérifié".
Section "L'avis de l'Expert" (Le compte rendu de l'admin).
Accès aux documents (si permis par l'abonnement).
3.5. Service Abonnements (Billing)
Gestion des plans (Freemium, Pro, Enterprise).
Gestion des quotas (ex: 10 consultations de CVs complets / mois).
Génération de factures PDF.

4. Règles de Gestion et Workflow
4.1. Le Workflow de Validation (Diagramme d'état)
Saisie (Candidat) : Upload des données.
Pré-qualification (Admin) : Vérification asynchrone des documents.
KO : Notification au candidat pour correction.
OK : Prise de RDV pour entretien.
Entretien (Admin + Candidat) : Visio ou Tel.
Décision (Admin) : Remplissage du Compte Rendu.
Publication : Le profil est indexé.
4.2. Gestion des Refus (Archivage)
Les profils refusés ne sont pas supprimés physiquement (Soft Delete).
Ils sont stockés dans une table RejectedProfiles avec le motif et la date.
L'admin peut rechercher dans cette "poubelle" pour réactiver un profil si besoin.

5. Exigences Non-Fonctionnelles (Qualité)
5.1. Sécurité & RGPD
Encryption : Tous les documents stockés doivent être chiffrés au repos (Server-Side Encryption S3).
Droit à l'oubli : Fonctionnalité permettant d'anonymiser totalement un candidat sur demande.
Logs d'accès : Chaque fois qu'un recruteur ouvre un CV, un log est créé (Qui, Quand, Quel CV).
5.2. Performance
Le moteur de recherche doit répondre en moins de 200ms.
L'upload de fichiers doit supporter des fichiers jusqu'à 10 Mo.
5.3. Scalabilité
L'architecture microservices doit permettre d'augmenter les ressources du Service Recherche indépendamment du Service Candidat en cas de pic de trafic recruteurs.

6. Roadmap de Développement (Suggestion)
Phase 1 (MVP - 2 mois) :
Auth + Profil Candidat (Saisie) + Upload Documents.
Back-office Admin (Vue simple de validation).
Pas de paiement, accès entreprise gratuit (Bêta test).
Phase 2 (V1 - 2 mois) :
Moteur de recherche ElasticSearch complet.
Compte rendu d'entretien structuré.
Gestion d'équipe entreprise.
Phase 3 (Monétisation - 1 mois) :
Intégration Stripe/PayPal.
Restriction des accès selon abonnement.



USER STORIES COMPLÈTES DE LA PLATEFORME
Les user stories sont rédigées selon le format agile :
En tant que [rôle], je veux [action] afin de [valeur métier].
11.1 USER STORIES – CANDIDAT
US-C-01 – Inscription candidat
En tant que candidat, je veux créer un compte avec mon email afin d’accéder à la plateforme et créer mon profil professionnel.
US-C-02 – Onboarding guidé
En tant que candidat, je veux être guidé étape par étape dans la création de mon profil afin de fournir des informations complètes et structurées.
US-C-03 – Sauvegarde progressive
En tant que candidat, je veux sauvegarder mon profil automatiquement afin de pouvoir reprendre l’onboarding plus tard.
US-C-04 – Gestion des expériences
En tant que candidat, je veux ajouter, modifier ou supprimer mes expériences professionnelles afin de refléter fidèlement mon parcours.
US-C-05 – Gestion des formations et certifications
En tant que candidat, je veux renseigner mes formations et certifications afin de prouver mon niveau de qualification.
US-C-06 – Gestion des compétences
En tant que candidat, je veux déclarer mes compétences avec un niveau afin d’améliorer ma visibilité auprès des recruteurs.
US-C-07 – Téléversement de documents
En tant que candidat, je veux importer mon CV et mes documents justificatifs afin de prouver la véracité de mes informations.
US-C-08 – Soumission du profil
En tant que candidat, je veux soumettre mon profil à validation afin qu’il soit préqualifié par l’équipe RH.
US-C-09 – Suivi du statut
En tant que candidat, je veux consulter le statut de mon profil afin de savoir s’il est en cours, validé ou refusé.
US-C-10 – Correction demandée
En tant que candidat, je veux pouvoir corriger mon profil suite à une demande de l’administrateur afin d’améliorer mes chances de validation.

11.2 USER STORIES – ENTREPRISE / RECRUTEUR
US-E-01 – Inscription entreprise
En tant qu’entreprise, je veux créer un compte afin d’accéder à la CVthèque de profils validés.
US-E-02 – Gestion des recruteurs
En tant qu’entreprise, je veux créer des sous-comptes recruteurs afin de permettre à mon équipe RH d’utiliser la plateforme.
US-E-03 – Recherche de profils
En tant que recruteur, je veux rechercher des candidats par mots-clés et filtres afin d’identifier rapidement les profils pertinents.
US-E-04 – Consultation des profils
En tant que recruteur, je veux consulter les profils candidats validés afin d’évaluer leur adéquation avec mes besoins.
US-E-05 – Consultation du compte rendu RH
En tant que recruteur, je veux accéder au compte rendu d’entretien afin de sécuriser ma décision de recrutement.
US-E-06 – Historique de consultation
En tant que recruteur, je veux retrouver l’historique des profils consultés afin d’assurer le suivi de mes recherches.

11.3 USER STORIES – ADMINISTRATEUR RH
US-A-01 – Accès à la file de préqualification
En tant qu’administrateur, je veux visualiser les profils en attente afin d’organiser la préqualification.
US-A-02 – Analyse du profil candidat
En tant qu’administrateur, je veux accéder à toutes les informations du candidat afin d’évaluer la cohérence et la crédibilité du profil.
US-A-03 – Vérification des documents
En tant qu’administrateur, je veux vérifier les documents fournis afin de m’assurer de leur authenticité.
US-A-04 – Rédaction du compte rendu
En tant qu’administrateur, je veux rédiger un compte rendu d’entretien structuré afin d’apporter une valeur ajoutée aux recruteurs.
US-A-05 – Validation du profil
En tant qu’administrateur, je veux valider un profil afin de le rendre visible dans la CVthèque.
US-A-06 – Refus du profil
En tant qu’administrateur, je veux refuser un profil afin de garantir la qualité globale de la plateforme.
US-A-07 – Archivage et réévaluation
En tant qu’administrateur, je veux archiver les profils refusés afin de pouvoir les réévaluer ultérieurement.

11.4 USER STORIES – ADMINISTRATION & SYSTÈME
US-S-01 – Gestion des abonnements
En tant qu’administrateur, je veux gérer les plans d’abonnement afin de contrôler l’accès aux fonctionnalités.
US-S-02 – Paiement sécurisé
En tant qu’entreprise, je veux payer mon abonnement en ligne afin d’accéder aux services.
US-S-03 – Notifications automatiques
En tant qu’utilisateur, je veux recevoir des notifications afin d’être informé des actions importantes.
US-S-04 – Journalisation des actions
En tant que super administrateur, je veux consulter les logs afin d’assurer la traçabilité et la sécurité.
US-S-05 – Scalabilité microservices
En tant que plateforme, je veux que chaque service soit indépendant afin d’assurer la performance et l’évolutivité.

