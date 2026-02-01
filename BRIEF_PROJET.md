# Brief projet — Yemma Solutions

**Document de référence décrivant le projet dans ses moindres détails (hors stack technique).**

---

## 1. Contexte et vision

**Yemma Solutions** est une plateforme de recrutement qui met en relation **candidats** et **entreprises / recruteurs**. Elle vise à :

- **Réduire les coûts de recrutement** pour les entreprises (moins d’agences, processus plus direct),
- **Accélérer le recrutement** (objectif affiché : temps moyen de l’ordre de 48 h),
- **Garantir la qualité des profils** grâce à une validation par des experts RH avant mise en visibilité.

L’idée centrale : une **CVthèque de candidats vérifiés**, accessibles aux entreprises via recherche avancée, avec des évaluations expertes (scores, résumés, avis) pour faciliter le matching et la décision.

---

## 2. Problème adressé et proposition de valeur

**Côté entreprises :**

- Coût élevé des agences de recrutement,
- Temps perdu à trier des CV non qualifiés,
- Risque de profils « embellis » ou peu fiables.

**Côté candidats :**

- Visibilité limitée auprès des bons recruteurs,
- Manque de retour structuré sur leur profil.

**Réponse Yemma :**

- **100 % des profils visibles** sont validés par des experts (entretien, évaluation, compte-rendu),
- **Recherche multi-critères** (secteur, compétences, expérience, localisation, etc.) pour cibler rapidement les bons profils,
- **Matching affiché** (ex. taux de matching ~87 %) et **évaluations détaillées** (scores, soft skills, synthèse) pour aider à la décision,
- **Économies annoncées** (ex. ~60 % sur les coûts de recrutement) et **gain de temps** (ex. ~15 h par semaine) grâce à l’automatisation de la recherche et du tri.

---

## 3. Acteurs et rôles

| Rôle | Description |
|------|-------------|
| **Candidat** | Personne qui crée un profil, le complète via un parcours d’onboarding, le soumet pour validation, puis le rend visible aux recruteurs une fois validé. |
| **Entreprise (Company Admin)** | Compte « maître » d’une société : crée l’entreprise, gère l’abonnement, invite des recruteurs, accède à la CVthèque et aux outils de recherche. |
| **Recruteur** | Membre d’une équipe de recrutement, invité par l’admin. Accès à la recherche et à la consultation des profils validés ; pas de gestion de l’abonnement ou de l’entreprise. |
| **Admin RH / Super Admin** | Équipe Yemma. Valide ou rejette les profils candidats, rédige les évaluations, consulte les statistiques, gère les entreprises. |

Les parcours et les écrans diffèrent selon le rôle (candidat, entreprise, recruteur, admin).

---

## 4. Parcours détaillés par acteur

### 4.1 Candidat

1. **Inscription**  
   - Choix « Je suis candidat » sur la landing ou la page de choix d’inscription.  
   - Création de compte (email, mot de passe, etc.).

2. **Onboarding en plusieurs étapes**  
   Le candidat complète son profil via un formulaire guidé (étapes numérotées, sauvegarde possible entre les étapes) :

   - **Étape 0 — Conditions et consentement**  
     Acceptation des CGU, politique de confidentialité, consentements (ex. vérification du profil).

   - **Étape 1 — Profil général**  
     Identité (prénom, nom, date de naissance, nationalité), contact (email, téléphone), adresse (adresse, ville, pays), titre professionnel, résumé (ex. min. 300 caractères), secteur d’activité, métier principal, années d’expérience.  
     Possibilité d’ajouter une **photo de profil**.

   - **Étape 2 — Expériences professionnelles**  
     Pour chaque expérience : entreprise, poste, secteur, dates, description, etc.  
     Possibilité de joindre des documents (ex. attestations).

   - **Étape 3 — Formations**  
     Diplômes, établissements, années, etc.

   - **Étape 4 — Certifications**  
     Certifications obtenues (nom, organisme, date, etc.).

   - **Étape 5 — Compétences**  
     Liste de compétences (techniques, transversales, etc.).

   - **Étape 6 — Documents**  
     Upload du **CV** et éventuellement d’autres documents (diplômes, certifications, etc.).

   - **Étape 7 — Recherche d’emploi**  
     Préférences : types de postes, secteurs ciblés, type de contrat, localisation, mobilité, disponibilité, fourchettes salariales, etc.

   - **Étape 8 — Récapitulatif**  
     Vue d’ensemble du profil avant soumission.  
     Le candidat **soumet** son profil pour validation.

3. **Après soumission**  
   - Page « Profil soumis avec succès » avec explication des **prochaines étapes** : examen par l’équipe Yemma, éventuel entretien, validation ou rejet avec retour.  
   - Accès au **dashboard candidat** : suivi du **statut** du profil (brouillon, soumis, en cours de validation, validé, rejeté), consultation et édition du profil, gestion des documents.

4. **Statuts du profil**  
   - **DRAFT** : Brouillon (onboarding non terminé ou non soumis).  
   - **SUBMITTED** : Soumis pour validation.  
   - **IN_REVIEW** : En cours d’examen par un admin.  
   - **VALIDATED** : Validé — le profil entre dans la CVthèque et devient visible aux recruteurs.  
   - **REJECTED** : Rejeté — le candidat reçoit un retour (motif, éventuellement pistes d’amélioration).  
   - **ARCHIVED** : Archivé (ex. après demande du candidat ou décision interne).

5. **Authentification**  
   - Connexion par email / mot de passe.  
   - Si le candidat n’a pas de profil : redirection vers l’onboarding.  
   - Si le profil existe mais n’est pas complété (ex. dernière étape < 7) : redirection vers l’étape appropriée.  
   - Si le profil est complété et validé (ou en attente) : accès au dashboard candidat.

---

### 4.2 Entreprise (Company Admin)

1. **Inscription**  
   - Choix « Je suis entreprise » (ou équivalent).  
   - Création du compte entreprise.

2. **Onboarding entreprise**  
   - **Informations générales** : nom de l’entreprise, identifiant légal (ex. RCCM), adresse.  
   - **Contact du référent** : prénom, nom, email, téléphone, fonction.  
   - **Logo** : upload du logo.  
   - **Récapitulatif** puis validation.

3. **Dashboard entreprise**  
   - **Vue d’ensemble** : présentation de l’entreprise, abonnement, équipe, accès rapide à la recherche.  
   - **Recherche** : accès à la CVthèque (recherche avancée, filtres, consultation des profils).  
   - **Gestion** : paramètres de l’entreprise, équipe, abonnement / facturation.

4. **Gestion de l’équipe**  
   - Liste des **membres** (recruteurs) invités.  
   - **Invitation** de nouveaux recruteurs par email.  
   - Les invités reçoivent un lien (ex. « Accepter l’invitation »), créent leur mot de passe puis accèdent à la recherche et aux profils au nom de l’entreprise.  
   - Possibilité de **retirer** un membre de l’équipe.

5. **Abonnement et quotas**  
   - Selon le **plan** (Freemium, Pro, Enterprise, Essentiel…) :  
     - nombre de **consultations de profils** (ex. 10/mois en Freemium, illimité en Pro/Enterprise),  
     - recherche illimitée ou non,  
     - accès aux documents (CV, etc.) ou non,  
     - multi-comptes (plusieurs recruteurs) ou non.  
   - Choix et gestion de l’abonnement (voir section 6).

---

### 4.3 Recruteur

1. **Accès**  
   - Invitation par l’admin de l’entreprise → lien d’acceptation → création du mot de passe → connexion.

2. **Droits**  
   - Accès à la **recherche** et à la **CVthèque** (profils validés uniquement).  
   - Consultation des **fiches candidat** (profil, évaluations expertes, documents si inclus dans le plan).  
   - **Pas** de gestion de l’entreprise, de l’abonnement ou des invitations.

3. **Contraintes**  
   - Un recruteur doit être associé à une entreprise.  
   - Si l’entreprise n’existe pas ou que l’invitation échoue : message d’erreur explicite (ex. « Votre compte n’est pas encore associé à une entreprise »).

---

### 4.4 Administrateur (Admin / Super Admin)

1. **Dashboard admin**  
   - **Statistiques** : nombre de profils par statut (brouillon, soumis, en validation, validé, rejeté, archivé).  
   - **Liste des profils** : filtrage par statut, tri, pagination.  
   - Accès aux **fiches candidat** pour examen et décision.

2. **Validation / rejet d’un profil**  
   - Ouverture de la **fiche de revue** du candidat (profil complet, documents, etc.).  
   - **Grille d’évaluation** :  
     - note globale (ex. 0–5),  
     - notes détaillées : compétences techniques, soft skills, communication, motivation (optionnel),  
     - **résumé** rédigé (obligatoire, min. 50 caractères),  
     - champs additionnels possibles : notes d’entretien, recommandations, tags, etc.  
   - **Valider** : le profil passe en **VALIDATED**, entre dans la CVthèque, le candidat peut être notifié.  
   - **Rejeter** : le profil passe en **REJECTED**, motif (et éventuellement retour) communiqués au candidat.

3. **Archivage**  
   - Possibilité d’**archiver** un profil (ex. candidature obsolète, demande du candidat).

4. **Historique**  
   - Consultation de l’**historique des évaluations** (validations / rejets passés) pour un même candidat.

---

## 5. Fonctionnalités principales par bloc

### 5.1 Candidats

- Création et mise à jour du **profil** (identité, expériences, formations, certifications, compétences, préférences emploi).  
- **Upload** de documents : photo de profil, CV, autres pièces.  
- **Soumission** du profil pour validation.  
- **Suivi du statut** (brouillon → soumis → en validation → validé / rejeté) et des retours.  
- **Édition** du profil même après soumission (selon les règles métier définies).

### 5.2 Entreprises et recruteurs

- **Recherche avancée** dans la CVthèque :  
  - recherche textuelle (mots-clés, métiers, compétences…),  
  - filtres : secteur, métier, expérience, localisation, type de contrat, disponibilité, compétences, niveaux d’études, etc.  
- **Consultation des profils** :  
  - fiche détaillée,  
  - **évaluation experte** (scores, résumé, avis),  
  - accès aux **documents** (CV, etc.) si le plan le permet.  
- **Gestion des quotas** :  
  - vérification du solde de consultations avant ouverture d’un profil,  
  - décompte à chaque consultation (selon les règles du plan).

### 5.3 Administration

- **Validation, rejet, archivage** des profils avec grille d’évaluation et historique.  
- **Statistiques** (répartition par statut, évolution).  
- **Gestion des entreprises** et de leurs abonnements (selon les périmètres prévus).

### 5.4 Commun

- **Authentification** (email / mot de passe) et **rôles** (candidat, company admin, recruteur, admin, super admin).  
- **Récupération de mot de passe** (ex. « Mot de passe oublié »).  
- **Pages légales** : mentions légales, politique de confidentialité, CGU.  
- **Contact** : formulaire ou coordonnées (email, téléphone, WhatsApp) pour joindre Yemma.

---

## 6. Modèle économique : plans et quotas

Les **plans** définissent les droits d’accès et les **quotas** (ex. consultations de profils par mois).

| Plan | Idée générale | Consultations profils | Recherche | Documents | Multi-comptes |
|------|----------------|------------------------|-----------|-----------|----------------|
| **Freemium** | Gratuit, découverte | 10 / mois | Limitée | Non | Non |
| **Pro** | Usage professionnel régulier | Illimité | Illimitée | Non | Non |
| **Enterprise** | Toutes fonctionnalités | Illimité | Illimitée | Oui | Oui |
| **Essentiel** | Adapté PME (ex. marché ivoirien) | 50 / mois | Illimitée | Oui | Non |

- **Consultation** = ouverture d’une fiche candidat détaillée (et éventuellement des pièces) ; chaque ouverture peut être décomptée.  
- Les **prix** (mensuel / annuel) et les **seuils** (ex. 10, 50) sont configurables.  
- **Facturation** : abonnements et paiements gérés côté plateforme (détails selon implémentation).

---

## 7. Processus de validation des profils

1. Le candidat **termine** l’onboarding et **soumet** son profil.  
2. Le statut passe à **SUBMITTED** (puis éventuellement **IN_REVIEW** lorsqu’un admin traite le dossier).  
3. Un **admin** ouvre la fiche, consulte le profil et les documents.  
4. Il remplit la **grille d’évaluation** (notes, résumé, etc.) et décide :  
   - **Valider** → statut **VALIDATED** : le profil est **indexé** dans la CVthèque et **visible** aux recruteurs.  
   - **Rejeter** → statut **REJECTED** : le candidat est informé (motif, retour).  
5. **Archivage** possible à tout moment pour sortir un profil du flux actif sans le supprimer.

Seuls les profils **VALIDATED** sont **recherchables et consultables** par les entreprises et recruteurs.

---

## 8. Secteurs, conformité, support

- **Secteurs d’activité** : la plateforme couvre une large palette de secteurs (technologie, finance, santé, industrie, commerce, BTP, etc.) ; les candidats et les offres peuvent être filtrés par secteur.  
- **Conformité** : la plateforme est conçue pour respecter les exigences **RGPD** (consentements, finalités, droits des personnes, audit). Un service dédié enregistre les **accès** et **actions** pour la traçabilité et l’audit.  
- **Notifications** : envoi d’emails (ou équivalent) pour, par exemple :  
  - validation ou rejet de profil,  
  - invitations recruteurs,  
  - rappels ou alertes (quota, échéances, etc.).  
- **Support** : possibilité de **contact** (formulaire, email, téléphone, WhatsApp) et mention d’un **support** (ex. 7 j/7) sur la landing.

---

## 9. Démo et acquisition

- **Landing** : présentation des bénéfices (coûts, rapidité, qualité des profils), témoignages, statistiques (ex. candidats vérifiés, temps moyen de recrutement, taux de satisfaction), liste des secteurs couverts.  
- **Démo CVthèque** : une **démo** publique permet de **voir la recherche et des fiches candidat** (données fictives) **sans compte** pour se faire une idée du produit.  
- **Essai gratuit** : les entreprises peuvent démarrer un **essai gratuit** (ex. 14 jours), **sans engagement** et **sans carte bancaire**, puis souscrire un plan si satisfaites.

---

## 10. Résumé des flux clés

| Acteur | Entrée | Actions principales | Sortie |
|--------|--------|---------------------|--------|
| **Candidat** | Inscription | Onboarding → soumission → suivi statut | Profil validé (visible) ou rejeté (avec retour) |
| **Entreprise** | Inscription | Onboarding → abonnement → équipe → recherche | Recrutement de candidats validés |
| **Recruteur** | Invitation | Accepter invitation → recherche → consultation profils | Mise en relation avec candidats |
| **Admin** | Connexion | Statistiques → validation / rejet / archivage | CVthèque à jour, candidats informés |

---

*Ce brief décrit le projet Yemma Solutions d’un point de vue fonctionnel et métier. Les choix d’implémentation (logiciels, infrastructures, langages) ne sont pas détaillés ici.*

**Yemma Solutions** — *Recrutement nouvelle génération*
