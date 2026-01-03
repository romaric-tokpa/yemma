# Configuration Nginx Gateway

## Vue d'ensemble

Le Gateway Nginx sert de point d'entrée unique pour tous les microservices de la plateforme Yemma Solutions. Il route les requêtes vers les services appropriés et applique des headers de sécurité.

## Architecture

```
Client (Browser/API)
    ↓
Nginx Gateway (Port 80/443)
    ↓
┌─────────────────────────────────────┐
│  Réseau Docker Interne (yemma-network) │
│                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────┐│
│  │  Auth    │  │Candidate │  │Search││
│  │  :8000   │  │  :8000   │  │ :8000││
│  └──────────┘  └──────────┘  └──────┘│
│  ┌──────────┐  ┌──────────┐  ┌──────┐│
│  │ Company  │  │ Payment  │  │Admin ││
│  │  :8000   │  │  :8000   │  │ :8000││
│  └──────────┘  └──────────┘  └──────┘│
│  ┌──────────┐  ┌──────────┐  ┌──────┐│
│  │Document  │  │Notification│ │Audit ││
│  │  :8000   │  │  :8000   │  │ :8000││
│  └──────────┘  └──────────┘  └──────┘│
│  ┌──────────┐                        │
│  │ Frontend │                        │
│  │  :3000   │                        │
│  └──────────┘                        │
└─────────────────────────────────────┘
```

## Routing

### Services Backend

| Chemin API | Service | Port Interne |
|------------|---------|--------------|
| `/api/v1/auth/*` | Auth Service | 8000 |
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

### Frontend

| Chemin | Service | Port Interne |
|--------|---------|--------------|
| `/` (toutes autres requêtes) | Frontend | 3000 |

## Headers de Sécurité

Le Gateway Nginx applique automatiquement les headers de sécurité suivants :

- **X-Frame-Options**: `SAMEORIGIN` - Empêche le clickjacking
- **X-Content-Type-Options**: `nosniff` - Empêche le MIME type sniffing
- **X-XSS-Protection**: `1; mode=block` - Protection XSS
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Contrôle des référents
- **Content-Security-Policy**: Politique stricte pour limiter les ressources chargées
- **Server Tokens**: `off` - Cache la version de Nginx

## Configuration

### Fichier de configuration

Le fichier `nginx.conf` est monté dans le container Nginx via Docker Compose.

### Variables d'environnement

Dans `.env` :

```bash
# Ports Nginx
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

## Utilisation

### Accès aux services via Gateway

**Avant (sans Gateway)** :
```bash
# Accès direct aux services
curl http://localhost:8001/api/v1/auth/login
curl http://localhost:8002/api/v1/candidates/me
```

**Après (avec Gateway)** :
```bash
# Accès via Nginx Gateway
curl http://localhost/api/v1/auth/login
curl http://localhost/api/v1/candidates/me
```

### Health Check

```bash
curl http://localhost/health
# Réponse: "healthy"
```

## Production

### Configuration HTTPS

Pour activer HTTPS en production :

1. Obtenir des certificats SSL (Let's Encrypt, etc.)
2. Décommenter la section `server` HTTPS dans `nginx.conf`
3. Configurer les chemins vers les certificats :
   ```nginx
   ssl_certificate /etc/nginx/ssl/cert.pem;
   ssl_certificate_key /etc/nginx/ssl/key.pem;
   ```
4. Monter les certificats dans Docker Compose :
   ```yaml
   volumes:
     - ./nginx/ssl:/etc/nginx/ssl:ro
   ```

### Optimisations

- **Keepalive connections** : Déjà configuré (32 connexions par upstream)
- **Gzip compression** : Activé pour les types de fichiers textuels
- **Client max body size** : 20M (50M pour `/api/v1/documents`)
- **Buffering** : Désactivé pour les API (meilleure latence)

## Dépannage

### Vérifier la configuration Nginx

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
4. **Les services d'infrastructure** (MinIO, ElasticSearch, Kibana) peuvent rester exposés pour l'administration, mais peuvent aussi être routés via Nginx en production

