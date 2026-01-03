# Configuration Nginx Gateway - Guide Complet

## Vue d'ensemble

Le Gateway Nginx sert de point d'entrée unique pour tous les microservices de la plateforme Yemma Solutions. Il route les requêtes vers les services appropriés et applique des headers de sécurité.

## Architecture

```
┌─────────────────────────────────────────┐
│         Client (Browser/API)            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     Nginx Gateway (Port 80/443)         │
│  - Routing vers services                 │
│  - Headers de sécurité                   │
│  - Compression Gzip                     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Réseau Docker Interne (yemma-network)  │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────┐  │
│  │  Auth    │  │Candidate │  │Search│  │
│  │  :8000   │  │  :8000   │  │ :8000│  │
│  └──────────┘  └──────────┘  └──────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────┐  │
│  │ Company  │  │ Payment  │  │Admin │  │
│  │  :8000   │  │  :8000   │  │ :8000│  │
│  └──────────┘  └──────────┘  └──────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────┐  │
│  │Document  │  │Notification│ │Audit │  │
│  │  :8000   │  │  :8000   │  │ :8000│  │
│  └──────────┘  └──────────┘  └──────┘  │
│  ┌──────────┐                        │
│  │ Frontend │                        │
│  │  :3000   │                        │
│  └──────────┘                        │
└──────────────────────────────────────┘
```

## Fichiers créés/modifiés

### 1. `nginx/nginx.conf`

Configuration complète du Gateway Nginx avec :
- Routing vers tous les services
- Headers de sécurité
- Compression Gzip
- Keepalive connections
- Support WebSocket pour Vite HMR

### 2. `docker-compose.yml`

Modifications :
- Ajout du service `nginx` en premier
- Retrait des ports exposés pour tous les services backend
- Tous les services dans le réseau interne `yemma-network`
- Seul Nginx expose les ports 80/443

### 3. `env.example`

Ajout des variables :
```bash
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

Mise à jour des variables frontend pour pointer vers le Gateway.

## Routing des requêtes

| Chemin API | Service | Port Interne |
|------------|---------|--------------|
| `/api/v1/auth/*` | Auth Service | 8000 |
| `/api/v1/users/*` | Auth Service | 8000 |
| `/api/v1/candidates/*` | Candidate Service | 8000 |
| `/api/v1/documents/*` | Document Service | 8000 |
| `/api/v1/search/*` | Search Service | 8000 |
| `/api/v1/companies/*` | Company Service | 8000 |
| `/api/v1/invitations/*` | Company Service | 8000 |
| `/api/v1/recruiters/*` | Company Service | 8000 |
| `/api/v1/payments/*` | Payment Service | 8000 |
| `/api/v1/subscriptions/*` | Payment Service | 8000 |
| `/api/v1/quotas/*` | Payment Service | 8000 |
| `/api/v1/invoices/*` | Payment Service | 8000 |
| `/api/v1/webhooks/*` | Payment Service | 8000 |
| `/api/v1/notifications/*` | Notification Service | 8000 |
| `/api/v1/triggers/*` | Notification Service | 8000 |
| `/api/v1/audit/*` | Audit Service | 8000 |
| `/api/v1/admin/*` | Admin Service | 8000 |
| `/` (autres) | Frontend | 3000 |

## Headers de sécurité

Le Gateway Nginx applique automatiquement :

- **X-Frame-Options**: `SAMEORIGIN` - Empêche le clickjacking
- **X-Content-Type-Options**: `nosniff` - Empêche le MIME type sniffing
- **X-XSS-Protection**: `1; mode=block` - Protection XSS
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Content-Security-Policy**: Politique stricte
- **Server Tokens**: `off` - Cache la version de Nginx

## Utilisation

### Avant (sans Gateway)

```bash
# Accès direct aux services
curl http://localhost:8001/api/v1/auth/login
curl http://localhost:8002/api/v1/candidates/me
curl http://localhost:8004/api/v1/search
```

### Après (avec Gateway)

```bash
# Accès via Nginx Gateway
curl http://localhost/api/v1/auth/login
curl http://localhost/api/v1/candidates/me
curl http://localhost/api/v1/search
```

### Health Check

```bash
curl http://localhost/health
# Réponse: "healthy"
```

## Démarrage

```bash
# Démarrer tous les services (y compris Nginx)
docker-compose up -d

# Vérifier que Nginx est démarré
docker-compose ps nginx

# Voir les logs Nginx
docker-compose logs -f nginx

# Tester la configuration Nginx
docker-compose exec nginx nginx -t
```

## Variables d'environnement Frontend

Les variables d'environnement du frontend ont été mises à jour pour pointer vers le Gateway :

```bash
# Avant
VITE_AUTH_API_URL=http://localhost:8001
VITE_CANDIDATE_API_URL=http://localhost:8002

# Après
VITE_AUTH_API_URL=http://localhost/api/v1/auth
VITE_CANDIDATE_API_URL=http://localhost/api/v1/candidates
```

## Production

### Configuration HTTPS

1. Obtenir des certificats SSL (Let's Encrypt, etc.)
2. Décommenter la section `server` HTTPS dans `nginx.conf`
3. Configurer les chemins vers les certificats
4. Monter les certificats dans Docker Compose :

```yaml
volumes:
  - ./nginx/ssl:/etc/nginx/ssl:ro
```

### Optimisations

- **Keepalive connections** : 32 connexions par upstream
- **Gzip compression** : Activé pour les types textuels
- **Client max body size** : 20M (50M pour `/api/v1/documents`)
- **Buffering** : Désactivé pour les API (meilleure latence)

## Dépannage

### Vérifier la configuration

```bash
docker-compose exec nginx nginx -t
```

### Voir les logs

```bash
# Logs d'accès
docker-compose logs nginx | grep access

# Logs d'erreur
docker-compose logs nginx | grep error
```

### Tester le routing

```bash
# Tester un endpoint
curl -v http://localhost/api/v1/auth/health

# Vérifier les headers
curl -I http://localhost/api/v1/candidates/me
```

## Notes importantes

1. **Tous les services backend** sont maintenant accessibles uniquement via Nginx
2. **Les ports internes** (8000) ne sont plus exposés sur l'hôte
3. **Le frontend** est également servi via Nginx
4. **Les services d'infrastructure** (MinIO, ElasticSearch, Kibana) peuvent rester exposés pour l'administration en développement, mais devraient être routés via Nginx en production

## Migration depuis l'ancienne configuration

Si vous aviez des scripts ou configurations pointant vers les anciens ports :

1. Mettre à jour les URLs pour utiliser le Gateway
2. Remplacer `http://localhost:8001` par `http://localhost/api/v1/auth`
3. Mettre à jour les variables d'environnement du frontend
4. Redémarrer les services

