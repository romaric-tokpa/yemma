# Guide de Connexion du Frontend aux Services Backend

Ce guide explique comment configurer et utiliser la connexion entre le frontend React et les différents services backend de la plateforme Yemma Solutions.

## 📋 Table des Matières

1. [Configuration des Variables d'Environnement](#configuration-des-variables-denvironnement)
2. [Architecture de Connexion](#architecture-de-connexion)
3. [Utilisation des Services API](#utilisation-des-services-api)
4. [Authentification](#authentification)
5. [Gestion des Erreurs](#gestion-des-erreurs)
6. [Développement Local](#développement-local)
7. [Production](#production)

---

## 🔧 Configuration des Variables d'Environnement

### Fichier `.env`

Le frontend utilise **Vite** comme build tool. Les variables d'environnement doivent avoir le préfixe `VITE_` pour être accessibles dans le code.

1. **Créer le fichier `.env`** dans le dossier `frontend/` :

```bash
cd frontend
cp .env.example .env
```

2. **Modifier les URLs** selon votre environnement :

```env
# Service Auth (Authentification)
VITE_AUTH_API_URL=http://localhost:8001

# Service Candidate (Profils candidats)
VITE_CANDIDATE_API_URL=http://localhost:8002

# Service Document (Gestion des documents)
VITE_DOCUMENT_API_URL=http://localhost:8003

# Service Search (Recherche ElasticSearch)
VITE_SEARCH_API_URL=http://localhost:8004

# Service Company (Entreprises et recruteurs)
VITE_COMPANY_API_URL=http://localhost:8005

# Service Payment (Paiements et abonnements)
VITE_PAYMENT_API_URL=http://localhost:8006

# Service Notification
VITE_NOTIFICATION_API_URL=http://localhost:8007

# Service Audit
VITE_AUDIT_API_URL=http://localhost:8008

# Service Admin (Validation des profils)
VITE_ADMIN_API_URL=http://localhost:8009
```

### Valeurs par Défaut

Si les variables d'environnement ne sont pas définies, les valeurs par défaut suivantes sont utilisées :

| Service | Port par Défaut |
|---------|----------------|
| Auth | 8001 |
| Candidate | 8002 |
| Document | 8003 |
| Search | 8004 |
| Company | 8005 |
| Payment | 8006 |
| Notification | 8007 |
| Audit | 8008 |
| Admin | 8009 |

---

## 🏗️ Architecture de Connexion

### Structure des Services API

Le fichier `src/services/api.js` contient tous les clients API organisés par service :

```
src/services/
└── api.js          # Tous les services API
```

### Clients Axios

Chaque service backend a son propre client Axios avec :

- **Base URL** configurée via les variables d'environnement
- **Intercepteur de requête** : Ajoute automatiquement le token JWT
- **Intercepteur de réponse** : Gère les erreurs (401, 403, etc.)

### Services Disponibles

1. **authApiService** : Authentification (login, register, etc.)
2. **candidateApi** : Gestion des profils candidats
3. **documentApi** : Upload et gestion des documents
4. **searchApiService** : Recherche de candidats
5. **companyApi** : Gestion des entreprises et recruteurs
6. **paymentApi** : Paiements et abonnements
7. **adminApi** : Validation des profils (admin)
8. **auditApiService** : Logs d'audit

---

## 💻 Utilisation des Services API

### Exemple 1 : Authentification

```javascript
import { authApiService } from '@/services/api'

// Connexion
const handleLogin = async (email, password) => {
  try {
    const response = await authApiService.login(email, password)
    // Le token est automatiquement stocké dans localStorage
    console.log('Connexion réussie', response)
    // Rediriger vers le dashboard
    navigate('/dashboard')
  } catch (error) {
    console.error('Erreur de connexion', error.response?.data)
  }
}

// Récupérer l'utilisateur actuel
const getCurrentUser = async () => {
  try {
    const user = await authApiService.getCurrentUser()
    console.log('Utilisateur', user)
  } catch (error) {
    console.error('Erreur', error)
  }
}

// Déconnexion
const handleLogout = () => {
  authApiService.logout()
  navigate('/login')
}
```

### Exemple 2 : Recherche de Candidats

```javascript
import { searchApiService } from '@/services/api'

const searchCandidates = async () => {
  try {
    const results = await searchApiService.searchCandidates({
      query: 'ingénieur',
      sectors: ['BTP', 'IT'],
      min_experience: 3,
      page: 1,
      size: 20,
    })
    console.log('Résultats', results)
  } catch (error) {
    console.error('Erreur de recherche', error)
  }
}
```

### Exemple 3 : Upload de Document

```javascript
import { documentApi } from '@/services/api'

const uploadDocument = async (file, candidateId) => {
  try {
    const result = await documentApi.uploadDocument(
      file,
      candidateId,
      'CV' // DocumentType: CV, ATTESTATION, CERTIFICATE, etc.
    )
    console.log('Document uploadé', result)
  } catch (error) {
    console.error('Erreur upload', error)
  }
}
```

### Exemple 4 : Validation Admin

```javascript
import { adminApi } from '@/services/api'

const validateCandidate = async (candidateId) => {
  try {
    const result = await adminApi.validateProfile(candidateId, {
      overallScore: 4.5,
      technicalSkills: 4.0,
      softSkills: 4.5,
      communication: 5.0,
      motivation: 4.5,
      softSkillsTags: ['leadership', 'teamwork'],
      interview_notes: 'Excellent candidat...',
      recommendations: 'Recommandé pour poste senior',
      summary: 'Candidat très compétent...',
    })
    console.log('Profil validé', result)
  } catch (error) {
    console.error('Erreur validation', error)
  }
}
```

---

## 🔐 Authentification

### Stockage du Token

Le token JWT est stocké dans `localStorage` avec la clé `auth_token` :

```javascript
localStorage.setItem('auth_token', token)
```

### Ajout Automatique du Token

Toutes les requêtes incluent automatiquement le token dans le header `Authorization` :

```javascript
Authorization: Bearer <token>
```

Ceci est géré par les intercepteurs Axios dans `api.js`.

### Gestion de l'Expiration

Si une requête retourne un 401 (Unauthorized), le token est supprimé automatiquement :

```javascript
// Dans api.js
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      // Optionnel: rediriger vers login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### Refresh Token

Pour renouveler un token expiré :

```javascript
import { authApiService } from '@/services/api'

const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token')
  if (refreshToken) {
    try {
      const response = await authApiService.refreshToken(refreshToken)
      // Le nouveau token est automatiquement stocké
      return response.access_token
    } catch (error) {
      // Refresh token expiré, déconnexion
      authApiService.logout()
      navigate('/login')
    }
  }
}
```

---

## ⚠️ Gestion des Erreurs

### Format d'Erreur

Les erreurs retournées par les services suivent le format FastAPI :

```javascript
{
  "detail": "Message d'erreur",
  "status_code": 400
}
```

### Exemple de Gestion d'Erreur

```javascript
try {
  const result = await candidateApi.getProfile(123)
} catch (error) {
  if (error.response) {
    // Erreur retournée par le serveur
    console.error('Erreur serveur:', error.response.status)
    console.error('Message:', error.response.data.detail)
    
    switch (error.response.status) {
      case 400:
        // Bad Request
        break
      case 401:
        // Unauthorized - Token invalide/expiré
        authApiService.logout()
        navigate('/login')
        break
      case 403:
        // Forbidden - Pas les permissions
        break
      case 404:
        // Not Found
        break
      case 500:
        // Server Error
        break
    }
  } else if (error.request) {
    // Requête envoyée mais pas de réponse
    console.error('Pas de réponse du serveur')
  } else {
    // Erreur lors de la configuration de la requête
    console.error('Erreur:', error.message)
  }
}
```

---

## 🚀 Développement Local

### Avec Docker Compose

Si vous utilisez Docker Compose, les services sont accessibles via `http://localhost:<port>` :

```env
VITE_AUTH_API_URL=http://localhost:8001
VITE_CANDIDATE_API_URL=http://localhost:8002
# ...
```

### Démarrer le Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`.

### Page Reset Password (mot de passe oublié)

Pour que la page `/reset-password` fonctionne :

**Option A – Stack complète (nginx + auth + postgres + notification)** :
```bash
docker-compose -f docker-compose.dev.yml up nginx auth postgres notification
```
Le frontend (port 3000) proxy vers nginx (8080). `.env` à la racine du projet, sans `VITE_AUTH_API_URL`.

**Option B – Auth seul (sans nginx)** :
```bash
docker-compose -f docker-compose.dev.yml up auth postgres notification
```
Dans `.env` à la racine :
```env
VITE_PROXY_TARGET=http://localhost:8001
# ou
VITE_AUTH_API_URL=http://localhost:8001
```
En mode dev, le lien de réinitialisation s’affiche directement sur la page (sans email).

### Hot Reload

Vite supporte le hot reload automatique. Les modifications dans le code sont reflétées immédiatement dans le navigateur.

---

## 🌐 Production

### Variables d'Environnement en Production

En production, définissez les variables d'environnement avec les URLs des services backend :

```env
VITE_AUTH_API_URL=https://api.yemma.com/auth
VITE_CANDIDATE_API_URL=https://api.yemma.com/candidate
VITE_SEARCH_API_URL=https://api.yemma.com/search
# ...
```

### Build de Production

```bash
npm run build
```

Les fichiers sont générés dans le dossier `dist/`.

### API Gateway (Recommandé)

En production, il est recommandé d'utiliser un **API Gateway** (Nginx, Kong) qui expose tous les services sous un même domaine :

```
https://api.yemma.com/auth/*     → Auth Service
https://api.yemma.com/candidate/* → Candidate Service
https://api.yemma.com/search/*   → Search Service
```

Dans ce cas, vous pouvez utiliser une seule URL de base :

```env
VITE_API_BASE_URL=https://api.yemma.com
```

Et modifier `api.js` pour utiliser cette URL de base avec des chemins relatifs.

---

## 📝 Checklist de Configuration

- [ ] Créer le fichier `.env` dans `frontend/`
- [ ] Configurer les URLs des services backend
- [ ] Vérifier que les services backend sont démarrés
- [ ] Tester la connexion avec un appel API simple
- [ ] Vérifier que l'authentification fonctionne
- [ ] Tester les erreurs (401, 403, 500)
- [ ] Configurer les variables d'environnement pour la production

---

## 🔍 Dépannage

### Erreur CORS

Si vous obtenez des erreurs CORS, vérifiez que les services backend autorisent l'origine du frontend :

```python
# Dans les services FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Token Non Envoyé

Vérifiez que le token est bien stocké dans `localStorage` :

```javascript
console.log(localStorage.getItem('auth_token'))
```

### Services Inaccessibles

Vérifiez que les services backend sont démarrés :

```bash
docker-compose ps
# ou
curl http://localhost:8001/health
```

### Variables d'Environnement Non Chargées

1. Vérifiez que les variables ont le préfixe `VITE_`
2. Redémarrez le serveur de développement (`npm run dev`)
3. Les variables d'environnement sont compilées au build, pas au runtime

---

## 📚 Références

- [Documentation Vite - Variables d'Environnement](https://vitejs.dev/guide/env-and-mode.html)
- [Documentation Axios](https://axios-http.com/)
- [Documentation FastAPI - CORS](https://fastapi.tiangolo.com/tutorial/cors/)

