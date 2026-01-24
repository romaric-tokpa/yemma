# Amélioration et Redesign des Routes - Documentation

## Vue d'ensemble

Ce document décrit les améliorations apportées à la structure de routage de l'application Yemma. L'objectif était de créer une architecture modulaire, maintenable et performante.

## 🎯 Objectifs atteints

### 1. Structure modulaire
- ✅ Organisation des routes par modules (auth, candidate, company, admin)
- ✅ Séparation claire des responsabilités
- ✅ Code plus maintenable et lisible

### 2. Performance
- ✅ Lazy loading de tous les composants
- ✅ Réduction du bundle initial
- ✅ Chargement à la demande des pages

### 3. Gestion des erreurs
- ✅ Page 404 personnalisée et informative
- ✅ Redirections intelligentes selon les rôles
- ✅ Gestion de la redirection après connexion

### 4. Sécurité
- ✅ Protection de toutes les routes sensibles
- ✅ Vérification des rôles avant accès
- ✅ Redirection automatique si non autorisé

## 📁 Structure des fichiers

```
frontend/src/
├── routes/
│   └── index.jsx              # Configuration centralisée des routes
├── layouts/
│   ├── CandidateLayout.jsx    # Layout pour les pages candidat
│   ├── CompanyLayout.jsx      # Layout pour les pages entreprise
│   ├── AdminLayout.jsx       # Layout pour les pages admin
│   └── PublicLayout.jsx      # Layout pour les pages publiques
├── constants/
│   └── routes.js             # Constantes pour toutes les routes
├── pages/
│   └── NotFound.jsx          # Page 404 personnalisée
└── components/
    └── AuthGuard.jsx         # Composant de protection des routes (amélioré)
```

## 🔄 Changements principaux

### Avant
- Routes définies directement dans `App.jsx`
- Pas de lazy loading
- Redirections codées en dur
- Pas de page 404 personnalisée
- Routes répétitives pour l'onboarding

### Après
- Routes organisées par modules dans `routes/index.jsx`
- Lazy loading de tous les composants
- Constantes centralisées dans `constants/routes.js`
- Page 404 avec liens utiles
- Génération dynamique des routes d'onboarding
- Layouts réutilisables pour chaque section

## 📋 Routes disponibles

### Routes publiques
- `/` - Landing page
- `/register/choice` - Choix d'inscription
- `/legal/mentions` - Mentions légales
- `/legal/privacy` - Politique de confidentialité
- `/legal/terms` - CGU

### Routes d'authentification
- `/login` - Connexion
- `/register/candidat` - Inscription candidat
- `/register/company` - Inscription entreprise
- `/reset-password` - Réinitialisation mot de passe
- `/invitation/accept` - Acceptation invitation

### Routes candidat (protégées)
- `/onboarding` → `/onboarding/step0`
- `/onboarding/step0` à `/onboarding/step8` - Étapes d'onboarding
- `/onboarding/complete` - Onboarding terminé
- `/candidate/dashboard` - Dashboard candidat
- `/candidate/profile/edit` - Édition profil
- `/profile/edit` → `/candidate/profile/edit` (alias)

### Routes entreprise (protégées)
- `/company/onboarding` - Onboarding entreprise
- `/company/dashboard` - Dashboard entreprise
- `/company/management` - Gestion entreprise
- `/company/search` → `/company/dashboard?tab=search`
- `/search` - Recherche candidats
- `/search/pro` - Recherche pro
- `/candidates/:candidateId` - Détail candidat

### Routes admin (protégées)
- `/admin/dashboard` - Dashboard admin
- `/admin/review/:candidateId` - Revue candidat

## 🛡️ Protection des routes

### AuthGuard amélioré
- Vérification du token JWT
- Validation des rôles
- Redirection intelligente selon le rôle
- Sauvegarde de l'URL demandée pour redirection après connexion
- Gestion des erreurs d'authentification

### Rôles et permissions
- `ROLE_CANDIDAT` - Accès aux routes candidat
- `ROLE_COMPANY_ADMIN` - Accès aux routes entreprise (admin)
- `ROLE_RECRUITER` - Accès aux routes recherche
- `ROLE_ADMIN` - Accès aux routes admin
- `ROLE_SUPER_ADMIN` - Accès complet

## 🎨 Layouts

Les layouts permettent de :
- Réutiliser la navbar et le footer
- Appliquer des styles communs
- Gérer la structure de page de manière cohérente

### Utilisation
Les layouts sont prêts à être utilisés. Pour les activer, il suffit d'envelopper les routes dans les composants Layout correspondants dans `routes/index.jsx`.

## 📝 Constantes de routes

Le fichier `constants/routes.js` centralise toutes les URLs :
- Facilite la maintenance
- Évite les erreurs de typo
- Permet le refactoring facile
- Fonctions utilitaires pour les routes dynamiques

### Exemple d'utilisation
```javascript
import { ROUTES, getDefaultRouteForRole } from '@/constants/routes'

// Utilisation simple
navigate(ROUTES.CANDIDATE_DASHBOARD)

// Route dynamique
navigate(ROUTES.CANDIDATE_DETAIL(candidateId))

// Route par défaut selon le rôle
navigate(getDefaultRouteForRole(userRoles))
```

## 🚀 Performance

### Lazy loading
Tous les composants sont chargés à la demande :
- Réduction du bundle initial
- Amélioration du temps de chargement
- Meilleure expérience utilisateur

### Suspense
Un composant de chargement est affiché pendant le chargement des routes :
- Feedback visuel pour l'utilisateur
- Expérience fluide

## 🔧 Maintenance

### Ajouter une nouvelle route
1. Importer le composant avec lazy loading dans `routes/index.jsx`
2. Ajouter la route dans la section appropriée (PublicRoutes, AuthRoutes, etc.)
3. Ajouter la constante dans `constants/routes.js` si nécessaire
4. Protéger avec AuthGuard si nécessaire

### Modifier une route existante
1. Modifier la constante dans `constants/routes.js`
2. Mettre à jour les références dans le code
3. Tester les redirections

## 📊 Bénéfices

1. **Maintenabilité** : Code organisé et modulaire
2. **Performance** : Lazy loading et optimisations
3. **Sécurité** : Protection robuste des routes
4. **UX** : Page 404 informative, redirections intelligentes
5. **Développement** : Constantes centralisées, moins d'erreurs

## 🔮 Améliorations futures possibles

- [ ] Implémenter les layouts dans les routes
- [ ] Ajouter des routes imbriquées pour une meilleure organisation
- [ ] Créer un système de breadcrumbs
- [ ] Ajouter des métadonnées de route (titre, description)
- [ ] Implémenter un système de permissions plus granulaire
- [ ] Ajouter des transitions entre les routes
