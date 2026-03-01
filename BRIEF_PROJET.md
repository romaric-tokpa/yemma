# Brief projet — Yemma Solutions

**Document de référence pour investisseurs et partenaires : vision, opportunité marché, modèle économique et spécifications produit.**

---

## Executive Summary

**Yemma Solutions** est une plateforme B2B de recrutement qui propose une **CVthèque de candidats 100 % pré-validés** par des experts RH. Les entreprises accèdent à des profils vérifiés (entretien, évaluation, scoring) via une recherche avancée et un matching intelligent, sans passer par les agences.

| Indicateur | Cible |
|------------|-------|
| **Réduction des coûts recrutement** | ~60 % vs agences |
| **Gain de temps recruteurs** | ~15 h / semaine |
| **Délai moyen de shortlist** | 48 h |
| **Qualité** | 100 % des profils visibles validés par entretien expert |

**Proposition de valeur** : Supprimer le tri de CV non qualifiés et les honoraires d'agence, tout en garantissant des profils fiables grâce à une validation humaine experte avant mise en visibilité.

---

## 1. Le problème

### Côté entreprises

| Pain point | Impact |
|------------|--------|
| **Coût élevé des agences** | 15–25 % du salaire annuel par recrutement |
| **Temps perdu à trier des CV** | Des centaines de candidatures non qualifiées par offre |
| **Profils embellis ou peu fiables** | Risque d'embauche ratée, turnover précoce |

### Côté candidats

- Visibilité limitée auprès des bons recruteurs
- Manque de retour structuré sur leur profil
- Processus opaques et longs

### Contexte marché

Le recrutement en Afrique (et au-delà) reste fragmenté : agences coûteuses, job boards sans curation, ATS qui accumulent des CV sans garantie de qualité. Les entreprises paient cher pour un processus lent et incertain.

---

## 2. Notre solution

**Yemma** inverse le modèle : au lieu de laisser les entreprises trier des centaines de CV, nous **pré-qualifions les candidats** avant qu'ils n'entrent dans la CVthèque.

### Mécanisme clé

1. **Candidat** : complète son profil (onboarding guidé) et le soumet pour validation
2. **Expert Yemma** : entretien, évaluation (scores, soft skills, synthèse), décision de validation ou rejet
3. **Entreprise** : accède uniquement aux profils **validés**, avec recherche avancée, matching affiché et évaluations détaillées

### Bénéfices mesurables

- **100 % des profils visibles** sont validés par entretien expert
- **Recherche multi-critères** (secteur, compétences, expérience, localisation)
- **Matching affiché** (ex. 87 %) et **évaluations détaillées** pour décider rapidement
- **Économies** : ~60 % sur les coûts de recrutement, ~15 h/semaine récupérées
- **Conformité RGPD** : consentements, traçabilité, droit à l'oubli

---

## 3. Opportunité de marché

### TAM / SAM / SOM (à affiner selon données)

| Périmètre | Description | Ordre de grandeur |
|-----------|-------------|-------------------|
| **TAM** | Marché global du recrutement (agences, job boards, ATS) | Multi-milliards € |
| **SAM** | Recrutement B2B en Afrique francophone (PME, ETI, grands groupes) | Croissance forte, marché sous-servi |
| **SOM** | Cible initiale : Côte d'Ivoire, Sénégal, puis expansion | Marché adressable immédiat |

### Tendances favorables

- **Digitalisation RH** : adoption croissante des outils en ligne
- **Coût des agences** : pression sur les budgets recrutement
- **Qualité vs quantité** : demande de profils pré-qualifiés plutôt que de volumes bruts
- **Télétravail / remote** : élargissement des bassins de candidats

---

## 4. Modèle économique

### Plans et quotas

| Plan | Cible | Consultations profils | Recherche | Documents | Multi-comptes |
|------|-------|----------------------|-----------|-----------|---------------|
| **Freemium** | Découverte | 10 / mois | Limitée | Non | Non |
| **Pro** | Usage régulier | Illimité | Illimitée | Non | Non |
| **Enterprise** | Grands comptes | Illimité | Illimitée | Oui | Oui |
| **Essentiel** | PME (ex. Côte d'Ivoire) | 50 / mois | Illimitée | Oui | Non |

- **Consultation** = ouverture d'une fiche candidat détaillée ; décompte selon le plan
- **Prix** : mensuel / annuel, configurables selon le marché
- **Facturation** : abonnements récurrents (SaaS)

### Unit economics (à valider)

- **CAC** : coût d'acquisition client (marketing, ventes)
- **LTV** : valeur vie client (rétention, expansion)
- **Marge** : coût de validation des profils vs revenus abonnements

---

## 5. Avantage concurrentiel

| Différenciateur | Yemma | Agences | Job boards | ATS classiques |
|-----------------|-------|---------|------------|----------------|
| Profils pré-validés par entretien | ✅ | ✅ | ❌ | ❌ |
| Pas d'honoraires % salaire | ✅ | ❌ | ✅ | ✅ |
| Recherche + matching + scoring | ✅ | Partiel | Limitée | Variable |
| Évaluations expertes intégrées | ✅ | ✅ | ❌ | ❌ |
| Modèle abonnement prévisible | ✅ | ❌ | Variable | ✅ |

**Moat** : La curation humaine des profils crée une base de données de qualité difficile à répliquer. Plus la CVthèque grandit, plus la valeur pour les entreprises augmente (effet de réseau côté offre).

---

## 6. Produit et fonctionnalités

### Acteurs

| Rôle | Description |
|------|-------------|
| **Candidat** | Crée un profil, le soumet pour validation, suit son statut |
| **Entreprise (Admin)** | Gère l'abonnement, invite des recruteurs, accède à la CVthèque |
| **Recruteur** | Invité par l'entreprise ; recherche et consultation des profils validés |
| **Admin Yemma** | Valide ou rejette les profils, rédige les évaluations, gère les entreprises |

### Flux principaux

- **Candidat** : Inscription → Onboarding (profil, expériences, formations, compétences, documents, préférences) → Soumission → Suivi statut (brouillon → soumis → en validation → validé / rejeté)
- **Entreprise** : Inscription → Onboarding entreprise → Abonnement → Invitation recruteurs → Recherche dans la CVthèque
- **Admin** : Validation / rejet avec grille d'évaluation (notes, résumé, soft skills) → Profils validés indexés dans la CVthèque

### Fonctionnalités clés

- **Recherche avancée** : mots-clés, filtres (secteur, métier, expérience, localisation, contrat, compétences)
- **Fiches candidat** : profil détaillé + évaluation experte (scores, résumé, avis) + documents (CV, etc.) selon le plan
- **Quotas** : décompte des consultations selon le plan souscrit
- **Authentification** : email/mot de passe, OAuth (Google, LinkedIn), récupération mot de passe

---

## 7. Go-to-market

- **Landing** : présentation des bénéfices, témoignages, statistiques (candidats vérifiés, temps de recrutement, satisfaction)
- **Démo CVthèque** : démo publique avec données fictives, sans compte, pour découvrir le produit
- **Essai gratuit** : 14 jours sans engagement ni carte bancaire pour les entreprises
- **Support** : contact (email, téléphone, WhatsApp), support 7 j/7 mentionné

---

## 8. Conformité et support

- **RGPD** : consentements, finalités, droits des personnes, audit ; service d'audit pour traçabilité des accès et actions
- **Secteurs** : technologie, finance, santé, industrie, BTP, commerce, etc.
- **Notifications** : validation/rejet de profil, invitations recruteurs, alertes quotas

---

## Annexe A — Parcours détaillés

### Candidat

1. **Inscription** : choix « Je suis candidat » → création de compte
2. **Onboarding** (étapes 0 à 8) : CGU/consentement → profil général (identité, contact, titre, résumé, secteur, métier, expérience) → expériences pro → formations → certifications → compétences → documents (CV, photo) → préférences emploi → récapitulatif → soumission
3. **Statuts** : DRAFT | SUBMITTED | IN_REVIEW | VALIDATED | REJECTED | ARCHIVED
4. **Post-soumission** : explication des prochaines étapes, dashboard de suivi

### Entreprise

1. **Inscription** : choix « Je suis entreprise » → création compte
2. **Onboarding** : infos entreprise (nom, RCCM, adresse), contact référent, logo
3. **Dashboard** : vue d'ensemble, recherche, gestion équipe, paramètres, abonnement
4. **Équipe** : invitation recruteurs par email, acceptation via lien, gestion des membres

### Admin

- **Validation** : fiche de revue, grille d'évaluation (note globale, compétences, soft skills, communication, résumé obligatoire) → Valider ou Rejeter
- **Archivage** : sortir un profil du flux actif
- **Historique** : consultations des évaluations passées

---

## Annexe B — Résumé des flux

| Acteur | Entrée | Actions principales | Sortie |
|--------|--------|---------------------|--------|
| **Candidat** | Inscription | Onboarding → soumission → suivi statut | Profil validé (visible) ou rejeté (avec retour) |
| **Entreprise** | Inscription | Onboarding → abonnement → équipe → recherche | Recrutement de candidats validés |
| **Recruteur** | Invitation | Accepter invitation → recherche → consultation profils | Mise en relation avec candidats |
| **Admin** | Connexion | Statistiques → validation / rejet / archivage | CVthèque à jour, candidats informés |

---

*Ce brief décrit le projet Yemma Solutions pour les investisseurs et partenaires. Les choix techniques (stack, infrastructure) sont documentés séparément.*

**Yemma Solutions** — *Recrutement nouvelle génération*
