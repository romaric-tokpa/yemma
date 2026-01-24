# Configuration Nginx Gateway

Gateway Nginx servant de point d'entrée unique pour tous les microservices de la plateforme Yemma Solutions.

## 🎯 Vue d'ensemble

Le Gateway Nginx sert de reverse proxy et load balancer pour tous les services de la plateforme. Il route les requêtes vers les services appropriés, applique des headers de sécurité, et gère la compression et le caching.

## 🏗️ Architecture

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

## 🛣️ Routing

### Services Backend

| Chemin API | Service | Port Interne | Description |
|------------|---------|--------------|-------------|
| `/api/v1/auth/*` | Auth Service | 8000 | Authentification et utilisateurs |
| `/api/v1/candidates/*` | Candidate Service | 8000 | Profils candidats |
| `/api/v1/documents/*` | Document Service | 8000 | Gestion des documents |
| `/api/v1/search/*` | Search Service | 8000 | Recherche de profils |
| `/api/v1/indexing/*` | Search Service | 8000 | Indexation Elasticsearch |
| `/api/v1/companies/*` | Company Service | 8000 | Entreprises et recruteurs |
| `/api/v1/invitations/*` | Company Service | 8000 | Invitations recruteurs |
| `/api/v1/recruiters/*` | Company Service | 8000 | Gestion des recruteurs |
| `/api/v1/payments/*` | Payment Service | 8000 | Paiements Stripe |
| `/api/v1/subscriptions/*` | Payment Service | 8000 | Abonnements |
| `/api/v1/quotas/*` | Payment Service | 8000 | Gestion des quotas |
| `/api/v1/webhooks/*` | Payment Service | 8000 | Webhooks Stripe |
| `/api/v1/notifications/*` | Notification Service | 8000 | Notifications |
| `/api/v1/triggers/*` | Notification Service | 8000 | Triggers d'emails |
| `/api/v1/audit/*` | Audit Service | 8000 | Logs d'audit RGPD |
| `/api/v1/admin/*` | Admin Service | 8000 | Administration |

### Frontend

| Chemin | Service | Port Interne |
|--------|---------|--------------|
| `/` (toutes autres requêtes) | Frontend | 3000 |

### Health Checks

| Chemin | Service | Description |
|--------|---------|-------------|
| `/health` | Nginx | Health check du gateway |
| `/api/v1/auth/health` | Auth Service | Health check auth |
| `/api/v1/candidates/health` | Candidate Service | Health check candidate |

## 🔒 Headers de Sécurité

Le Gateway Nginx applique automatiquement les headers de sécurité suivants :

- **X-Frame-Options**: `SAMEORIGIN` - Empêche le clickjacking
- **X-Content-Type-Options**: `nosniff` - Empêche le MIME type sniffing
- **X-XSS-Protection**: `1; mode=block` - Protection XSS
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Contrôle des référents
- **Content-Security-Policy**: Politique stricte pour limiter les ressources chargées
- **Server Tokens**: `off` - Cache la version de Nginx
- **Strict-Transport-Security**: `max-age=31536000` (en HTTPS)

## ⚙️ Configuration

### Fichier de configuration

Le fichier `nginx.conf` est monté dans le container Nginx via Docker Compose.

### Variables d'environnement

Dans `.env` :

```env
# Ports Nginx
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 🚀 Utilisation

### Accès aux services via Gateway

**Avant (sans Gateway)** :
```bash
# Accès direct aux services (ports exposés)
curl http://localhost:8001/api/v1/auth/login
curl http://localhost:8002/api/v1/candidates/me
```

**Après (avec Gateway)** :
```bash
# Accès via Nginx Gateway (port unique)
curl http://localhost/api/v1/auth/login
curl http://localhost/api/v1/candidates/me
```

### Avantages du Gateway

- ✅ **Point d'entrée unique** : Un seul port (80) pour tous les services
- ✅ **Pas de CORS** : Toutes les requêtes passent par le même origin
- ✅ **Sécurité centralisée** : Headers de sécurité appliqués automatiquement
- ✅ **Load balancing** : Distribution des requêtes (si plusieurs instances)
- ✅ **SSL/TLS centralisé** : Configuration HTTPS unique

## 🔧 Optimisations

### Compression Gzip

Activé pour les types de fichiers suivants :
- `text/html`, `text/css`, `text/javascript`
- `application/json`, `application/javascript`
- `text/xml`, `application/xml`

### Client Max Body Size

- **Par défaut** : 20M
- **Documents** : 50M (pour `/api/v1/documents/*`)

### Keepalive Connections

- **32 connexions** par upstream pour améliorer les performances
- Réduction de la latence pour les requêtes répétées

### Buffering

- **Désactivé** pour les API (meilleure latence)
- **Activé** pour les fichiers statiques (meilleur débit)

## 🔐 Production

### Configuration HTTPS

Pour activer HTTPS en production :

1. **Obtenir des certificats SSL** (Let's Encrypt, etc.)
2. **Décommenter la section HTTPS** dans `nginx.conf`
3. **Configurer les chemins vers les certificats** :
   ```nginx
   ssl_certificate /etc/nginx/ssl/cert.pem;
   ssl_certificate_key /etc/nginx/ssl/key.pem;
   ```
4. **Monter les certificats** dans Docker Compose :
   ```yaml
   volumes:
     - ./nginx/ssl:/etc/nginx/ssl:ro
   ```

### Configuration SSL recommandée

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### Rate Limiting

Peut être ajouté pour protéger contre les attaques DDoS :

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://backend;
}
```

## 🐛 Dépannage

### Vérifier la configuration Nginx

```bash
# Tester la configuration
docker-compose exec nginx nginx -t

# Recharger la configuration
docker-compose exec nginx nginx -s reload
```

### Voir les logs

```bash
# Logs d'accès
docker-compose logs nginx | grep access

# Logs d'erreur
docker-compose logs nginx | grep error

# Logs en temps réel
docker-compose logs -f nginx
```

### Tester le routing

```bash
# Tester un endpoint
curl -v http://localhost/api/v1/auth/health

# Vérifier les headers
curl -I http://localhost/api/v1/candidates/me

# Tester avec authentification
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost/api/v1/candidates/me
```

### Problèmes courants

#### 502 Bad Gateway

- Vérifier que le service backend est démarré
- Vérifier la connectivité réseau Docker
- Vérifier les logs du service backend

#### 504 Gateway Timeout

- Augmenter `proxy_read_timeout` dans nginx.conf
- Vérifier les performances du service backend

#### CORS errors

- Vérifier que les requêtes passent bien par Nginx
- Vérifier la configuration CORS dans les services backend

## 📝 Notes importantes

1. ✅ **Tous les services backend** sont accessibles uniquement via Nginx
2. ✅ **Les ports internes** (8000) ne sont plus exposés sur l'hôte
3. ✅ **Le frontend** est également servi via Nginx
4. ✅ **Les services d'infrastructure** (MinIO, ElasticSearch) peuvent rester exposés pour l'administration, mais peuvent aussi être routés via Nginx en production
5. ✅ **Pas de CORS** : Toutes les requêtes passent par le même origin

## 🚀 Prochaines étapes

- [ ] Implémenter le rate limiting
- [ ] Ajouter le caching pour les réponses statiques
- [ ] Configurer le load balancing (si plusieurs instances)
- [ ] Ajouter la compression Brotli
- [ ] Implémenter le monitoring (Prometheus, Grafana)

---

**Configuration développée pour Yemma Solutions**
