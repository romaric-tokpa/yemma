# Frontend - Yemma Solutions

Application React moderne pour la plateforme de recrutement Yemma Solutions.

## 🎯 Vue d'ensemble

Application frontend développée avec React, Vite, et Tailwind CSS, offrant une interface utilisateur moderne et responsive pour :
- **Candidats** : Création et gestion de profil, suivi de validation
- **Entreprises** : Recherche de profils, gestion d'équipe, abonnements
- **Administrateurs** : Validation de profils, gestion des entreprises

## ✨ Fonctionnalités

- ✅ Authentification complète (login, register, password reset)
- ✅ Onboarding candidat en plusieurs étapes
- ✅ Onboarding entreprise avec informations de contact
- ✅ Recherche avancée de profils avec filtres multiples
- ✅ Affichage de profils avec avis experts
- ✅ Gestion d'équipe pour les entreprises
- ✅ Gestion des abonnements
- ✅ Dashboard administrateur
- ✅ Interface responsive (mobile, tablette, desktop)
- ✅ Thème cohérent avec la charte graphique

## 🛠️ Technologies

- **React** 18+ : Bibliothèque UI
- **Vite** : Build tool et dev server
- **React Router** : Navigation
- **React Hook Form** : Gestion de formulaires
- **Zod** : Validation de schémas
- **Tailwind CSS** : Styling utility-first
- **Axios** : Client HTTP
- **Lucide React** : Icônes
- **shadcn/ui** : Composants UI réutilisables

## 📁 Structure

```
frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── ui/             # Composants UI de base (shadcn)
│   │   ├── common/         # Composants communs
│   │   ├── layout/         # Composants de layout
│   │   ├── onboarding/     # Composants d'onboarding
│   │   ├── search/         # Composants de recherche
│   │   ├── company/        # Composants entreprise
│   │   └── admin/          # Composants admin
│   ├── pages/              # Pages de l'application
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── RegisterCandidat.jsx
│   │   ├── RegisterCompany.jsx
│   │   ├── CandidateDashboard.jsx
│   │   ├── CompanyDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── ProSearchPage.jsx
│   │   └── ...
│   ├── services/           # Clients API
│   │   └── api.js          # Client API principal
│   ├── contexts/           # Contextes React
│   ├── utils/              # Utilitaires
│   ├── data/               # Données mock (démo)
│   ├── routes/             # Configuration des routes
│   ├── schemas/            # Schémas de validation
│   ├── App.jsx             # Composant racine
│   └── main.jsx            # Point d'entrée
├── public/                 # Fichiers statiques
├── package.json
├── vite.config.js
├── tailwind.config.js
└── Dockerfile
```

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation des dépendances

```bash
# Installer les dépendances
npm install

# Ou avec yarn
yarn install
```

### Configuration

Les variables d'environnement sont définies dans `.env` ou `.env.local` :

```env
# URLs des services backend (optionnel, utilise nginx par défaut)
VITE_AUTH_API_URL=http://localhost:8001
VITE_CANDIDATE_API_URL=http://localhost:8002
VITE_DOCUMENT_API_URL=http://localhost:8003
VITE_SEARCH_API_URL=http://localhost:8004
VITE_COMPANY_API_URL=http://localhost:8005
VITE_PAYMENT_API_URL=http://localhost:8006
VITE_NOTIFICATION_API_URL=http://localhost:8007
VITE_ADMIN_API_URL=http://localhost:8009
```

**Note** : En production/Docker, toutes les requêtes passent par nginx (port 80), donc les chemins relatifs sont utilisés.

## 🏃 Développement

### Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

**Connexion (login)** : en dev, les appels API sont envoyés vers le proxy Vite (`/api` → gateway nginx). Démarrez le backend pour que le login fonctionne :
```bash
# À la racine du projet
docker-compose -f docker-compose.dev.yml up nginx auth candidate
```
(Sans backend, vous aurez une erreur 404 ou « Impossible de contacter le serveur » sur la page de connexion.)

### Build pour production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`.

### Preview de la production

```bash
npm run preview
```

## 🐳 Docker

### Build et démarrage

```bash
# Depuis la racine du projet
docker-compose up frontend

# Ou build manuel
docker build -t yemma-frontend .
docker run -p 3000:80 yemma-frontend
```

## 📱 Pages principales

### Pages publiques
- `/` : Page d'accueil (landing page)
- `/login` : Connexion
- `/register/candidat` : Inscription candidat
- `/register/company` : Inscription entreprise
- `/demo/cvtheque` : Démo publique de la CVthèque

### Pages candidat
- `/candidate/dashboard` : Dashboard candidat
- `/candidate/onboarding` : Onboarding en plusieurs étapes
- `/candidate/profile` : Gestion du profil

### Pages entreprise
- `/company/dashboard` : Dashboard entreprise
- `/company/onboarding` : Configuration de l'entreprise
- `/company/dashboard?tab=search` : Recherche de profils
- `/company/dashboard?tab=team` : Gestion de l'équipe
- `/company/dashboard?tab=subscription` : Gestion de l'abonnement

### Pages admin
- `/admin/dashboard` : Dashboard administrateur
- `/admin/review/{candidateId}` : Validation de profil

## 🎨 Charte graphique

### Couleurs principales
- **Vert émeraude** : `#226D68` (couleur primaire)
- **Bleu profond** : `#1e3a8a` (couleur secondaire)
- **Gris anthracite** : `#2d3748` (texte)
- **Gris clair** : `#f7fafc` (fond)

### Typographie
- **Headings** : Font personnalisée (font-heading)
- **Body** : System fonts (sans-serif)

## 🔧 Composants principaux

### Composants UI (shadcn/ui)
- `Button` : Boutons avec variantes
- `Input` : Champs de saisie
- `Card` : Cartes
- `Dialog` : Modales
- `Badge` : Badges
- `Tabs` : Onglets
- Et plus...

### Composants métier
- `AuthGuard` : Protection des routes
- `OnboardingStepper` : Stepper d'onboarding
- `AdvancedSearchFilters` : Filtres de recherche avancés
- `ProCandidateList` : Liste de candidats
- `ExpertReviewDialog` : Dialog d'avis expert

## 🔐 Authentification

L'authentification utilise JWT stocké dans `localStorage` :
- `auth_token` : Token d'accès
- `refresh_token` : Token de rafraîchissement
- `user` : Informations de l'utilisateur

Le client API (`services/api.js`) intercepte automatiquement les requêtes pour ajouter le token.

## 📡 Communication avec l'API

Tous les appels API passent par le client centralisé dans `services/api.js` :

```javascript
import { candidateApi, companyApi, searchApiService } from '@/services/api'

// Exemple : Récupérer mon profil
const profile = await candidateApi.getMyProfile()

// Exemple : Rechercher des candidats
const results = await searchApiService.postSearch({
  query: "développeur",
  min_experience: 3,
  page: 1,
  size: 25
})
```

## 🧪 Tests

### Tests unitaires

```bash
# Exécuter les tests
npm test

# Avec couverture
npm run test:coverage

# Mode watch
npm run test:watch
```

### Tests E2E (à implémenter)

```bash
npm run test:e2e
```

## 📦 Build et déploiement

### Build de production

```bash
npm run build
```

Le build génère :
- Fichiers optimisés et minifiés
- Code splitting automatique
- Assets optimisés (images, fonts)

### Déploiement

L'application peut être déployée sur :
- **Nginx** : Serveur web statique
- **Vercel** : Plateforme de déploiement
- **Netlify** : Plateforme de déploiement
- **AWS S3 + CloudFront** : Infrastructure cloud

## 🐛 Dépannage

### Erreur de connexion API

Vérifier que :
1. Les services backend sont démarrés
2. Les URLs dans `.env` sont correctes
3. Nginx est configuré correctement (en Docker)

### Erreur de build

```bash
# Nettoyer le cache
rm -rf node_modules dist
npm install
npm run build
```

### Problèmes de styles

Vérifier que Tailwind CSS est correctement configuré dans `tailwind.config.js`.

## 📚 Documentation

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Router Documentation](https://reactrouter.com)

## 🚀 Prochaines étapes

- [ ] Ajouter les tests E2E avec Playwright
- [ ] Implémenter le mode sombre
- [ ] Ajouter les notifications en temps réel
- [ ] Optimiser les performances (lazy loading, code splitting)
- [ ] Ajouter PWA support
- [ ] Implémenter l'internationalisation (i18n)

---

**Application développée pour Yemma Solutions**
