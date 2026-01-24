# Payment Service

Service de gestion des paiements et abonnements avec intégration Stripe complète pour la plateforme Yemma Solutions.

## 🎯 Vue d'ensemble

Le service payment gère l'ensemble du cycle de vie des abonnements et paiements pour les entreprises, avec intégration Stripe pour les transactions sécurisées.

## ✨ Fonctionnalités

- ✅ Intégration Stripe complète (Checkout, Subscriptions, Webhooks)
- ✅ Gestion de 3 plans : Freemium, Pro, Enterprise
- ✅ Système de quotas avec décrémentation automatique
- ✅ Gestion des abonnements et paiements
- ✅ Génération automatique de factures
- ✅ Webhooks Stripe pour synchronisation automatique
- ✅ Gestion des périodes de facturation (mensuel/annuel)
- ✅ Seed automatique des plans au démarrage

## 📁 Structure

```
services/payment/
├── app/
│   ├── main.py                 # Point d'entrée FastAPI
│   ├── api/v1/
│   │   ├── plans.py           # Endpoints plans
│   │   ├── subscriptions.py   # Endpoints abonnements
│   │   ├── payments.py        # Endpoints paiements
│   │   ├── webhooks.py        # Webhooks Stripe
│   │   └── quotas.py          # Endpoints quotas
│   ├── core/
│   │   ├── config.py          # Configuration
│   │   └── exceptions.py      # Gestion des erreurs
│   ├── domain/
│   │   ├── models.py          # Modèles SQLModel
│   │   └── schemas.py         # Schémas Pydantic
│   └── infrastructure/
│       ├── database.py        # Configuration DB
│       ├── stripe_client.py  # Client Stripe
│       ├── repositories.py   # Repositories
│       ├── seed.py           # Seed des plans
│       └── internal_auth.py  # Authentification interne
├── Dockerfile
├── requirements.txt
└── README.md
```

## 📊 Modèles de données

### Plan

Modèle représentant un plan d'abonnement :

- `id` : ID unique
- `name` : Nom du plan (ex: "Plan Pro")
- `plan_type` : Type (FREEMIUM, PRO, ENTERPRISE)
- `price_monthly` : Prix mensuel (en centimes)
- `price_yearly` : Prix annuel (en centimes)
- `max_profile_views` : Nombre max de consultations (None = illimité)
- `unlimited_search` : Recherche illimitée (bool)
- `document_access` : Accès aux documents (bool)
- `multi_accounts` : Multi-comptes recruteurs (bool)
- `stripe_price_id_monthly` : ID prix Stripe mensuel
- `stripe_price_id_yearly` : ID prix Stripe annuel
- `is_active` : Plan actif (bool)
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

### Subscription

Modèle représentant un abonnement d'entreprise :

- `id` : ID unique
- `company_id` : ID de l'entreprise (FK vers company-service)
- `plan_id` : ID du plan (FK vers Plan)
- `status` : Statut (active, cancelled, past_due, unpaid, trialing)
- `stripe_subscription_id` : ID abonnement Stripe
- `stripe_customer_id` : ID client Stripe
- `billing_period` : Période (monthly, yearly)
- `current_period_start` : Début période actuelle
- `current_period_end` : Fin période actuelle
- `cancel_at_period_end` : Annulation à la fin de la période (bool)
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

### Payment

Modèle représentant un paiement :

- `id` : ID unique
- `subscription_id` : ID de l'abonnement (FK vers Subscription)
- `amount` : Montant (en centimes)
- `currency` : Devise (EUR par défaut)
- `status` : Statut (pending, succeeded, failed, refunded)
- `stripe_payment_intent_id` : ID paiement Stripe
- `stripe_checkout_session_id` : ID session checkout Stripe
- `paid_at` : Date de paiement
- `created_at` : Date de création

### Quota

Modèle représentant un quota d'utilisation :

- `id` : ID unique
- `subscription_id` : ID de l'abonnement (FK vers Subscription)
- `quota_type` : Type (profile_views, document_downloads, etc.)
- `limit` : Limite (None = illimité)
- `used` : Utilisé (compteur)
- `period_start` : Début période
- `period_end` : Fin période
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

## 💳 Plans disponibles

### Freemium
- **Prix** : 0€/mois
- **Consultations** : 10 profils/mois
- **Recherche** : Limitée
- **Documents** : ❌ Pas d'accès
- **Multi-comptes** : ❌ Non

### Pro
- **Prix** : 49.99€/mois ou 499.99€/an
- **Consultations** : ✅ Illimitées
- **Recherche** : ✅ Illimitée
- **Documents** : ❌ Pas d'accès
- **Multi-comptes** : ❌ Non

### Enterprise
- **Prix** : 199.99€/mois ou 1999.99€/an
- **Consultations** : ✅ Illimitées
- **Recherche** : ✅ Illimitée
- **Documents** : ✅ Accès complet
- **Multi-comptes** : ✅ Oui

## 🚀 Endpoints

### Plans

#### GET /api/v1/plans

Liste tous les plans actifs.

**Réponse :**
```json
[
  {
    "id": 1,
    "name": "Freemium",
    "plan_type": "FREEMIUM",
    "price_monthly": 0,
    "price_yearly": 0,
    "max_profile_views": 10,
    "unlimited_search": false,
    "document_access": false,
    "multi_accounts": false
  },
  {
    "id": 2,
    "name": "Pro",
    "plan_type": "PRO",
    "price_monthly": 4999,
    "price_yearly": 49999,
    "max_profile_views": null,
    "unlimited_search": true,
    "document_access": false,
    "multi_accounts": false
  }
]
```

#### GET /api/v1/plans/{plan_id}

Récupère les détails d'un plan.

### Abonnements

#### GET /api/v1/subscriptions/company/{company_id}

Récupère l'abonnement d'une entreprise.

**Réponse :**
```json
{
  "id": 1,
  "company_id": 123,
  "plan": {
    "id": 2,
    "name": "Pro",
    "plan_type": "PRO",
    "price_monthly": 4999
  },
  "status": "active",
  "billing_period": "monthly",
  "current_period_start": "2024-01-01T00:00:00",
  "current_period_end": "2024-02-01T00:00:00",
  "quota_limit": null,
  "quota_used": 0
}
```

### Paiements

#### POST /api/v1/payments/checkout

Crée une session de checkout Stripe.

**Body :**
```json
{
  "company_id": 1,
  "plan_id": 2,
  "billing_period": "monthly"
}
```

**Réponse :**
```json
{
  "session_id": "cs_test_...",
  "url": "https://checkout.stripe.com/...",
  "company_id": 1,
  "plan_id": 2
}
```

### Webhooks

#### POST /api/v1/webhooks/stripe

Endpoint pour recevoir les webhooks Stripe.

**Événements gérés :**
- `checkout.session.completed` : Crée l'abonnement après paiement
- `invoice.paid` : Met à jour le paiement et génère la facture
- `customer.subscription.updated` : Met à jour l'abonnement
- `customer.subscription.deleted` : Annule l'abonnement

### Quotas

#### POST /api/v1/quotas/check

Vérifie si un quota est disponible.

**Body :**
```json
{
  "company_id": 1,
  "quota_type": "profile_views"
}
```

**Réponse :**
```json
{
  "allowed": true,
  "used": 5,
  "limit": 10,
  "remaining": 5,
  "message": null
}
```

#### POST /api/v1/quotas/use

Utilise un quota (décrémente le compteur).

**Body :**
```json
{
  "company_id": 1,
  "quota_type": "profile_views",
  "amount": 1
}
```

**Réponse :**
```json
{
  "success": true,
  "used": 6,
  "limit": 10,
  "remaining": 4
}
```

## ⚙️ Configuration

Variables d'environnement :

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=eur

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=yemma_payment_db

# Service URLs
COMPANY_SERVICE_URL=http://company-service:8005
FRONTEND_URL=http://localhost:3000

# Internal Auth (pour appels inter-services)
INTERNAL_AUTH_SECRET=your-internal-secret
```

## 🔧 Configuration Stripe

### 1. Créer un compte Stripe

1. Créer un compte sur https://stripe.com
2. Passer en mode test pour le développement

### 2. Récupérer les clés API

1. Aller dans Dashboard > Developers > API keys
2. Copier la clé secrète (`sk_test_...`)
3. Copier la clé publique (`pk_test_...`)

### 3. Créer les produits et prix

Les plans sont créés automatiquement au démarrage du service, mais vous devez créer les produits correspondants dans Stripe :

1. **Freemium** : Créer un produit avec prix 0€
2. **Pro** : Créer un produit avec prix mensuel (49.99€) et annuel (499.99€)
3. **Enterprise** : Créer un produit avec prix mensuel (199.99€) et annuel (1999.99€)

### 4. Configurer les webhooks

1. Aller dans Dashboard > Developers > Webhooks
2. Ajouter un endpoint : `https://your-domain.com/api/v1/webhooks/stripe`
3. Sélectionner les événements :
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copier le secret du webhook (`whsec_...`)

## 🛠️ Développement

### Installation locale

```bash
# Installer les dépendances
pip install -r requirements.txt

# Démarrer le service
uvicorn app.main:app --reload --port 8006
```

### Avec Docker

```bash
# Build et démarrage
docker-compose up payment-service

# Voir les logs
docker-compose logs -f payment-service
```

## 🧪 Tests avec Stripe CLI

Les webhooks Stripe peuvent être testés localement avec Stripe CLI :

```bash
# Installer Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Linux: voir https://stripe.com/docs/stripe-cli

# Écouter les webhooks et les forwarder
stripe listen --forward-to localhost:8006/api/v1/webhooks/stripe

# Déclencher un événement de test
stripe trigger checkout.session.completed
```

## 🔄 Flux d'abonnement

### 1. Création d'une session de checkout

```python
# Frontend ou Company Service
response = await payment_api.create_checkout({
    "company_id": 1,
    "plan_id": 2,
    "billing_period": "monthly"
})

# Rediriger l'utilisateur vers response.url
```

### 2. Paiement sur Stripe

L'utilisateur complète le paiement sur la page Stripe Checkout.

### 3. Webhook checkout.session.completed

Stripe envoie un webhook, le service :
1. Crée l'abonnement
2. Crée le client Stripe si nécessaire
3. Met à jour l'entreprise avec l'abonnement

### 4. Webhook invoice.paid

Stripe envoie un webhook, le service :
1. Met à jour le paiement
2. Génère la facture
3. Réinitialise les quotas pour la nouvelle période

## 📊 Gestion des quotas

### Réinitialisation automatique

Les quotas sont réinitialisés automatiquement :
- Au début de chaque période de facturation
- Basé sur `current_period_start` de l'abonnement

### Décrémentation

Lorsqu'une entreprise consulte un profil :
1. Vérifier le quota : `POST /api/v1/quotas/check`
2. Si autorisé, utiliser le quota : `POST /api/v1/quotas/use`
3. Si quota épuisé, refuser l'accès

## 🧪 Tests

```bash
# Exécuter les tests
pytest

# Avec couverture
pytest --cov=app
```

## 📝 Notes importantes

- ✅ Les quotas sont réinitialisés chaque mois (période basée sur `current_period_start`)
- ✅ Les plans sont créés automatiquement au démarrage du service si ils n'existent pas
- ✅ Les factures sont générées automatiquement lors du paiement d'une facture Stripe
- ✅ Le service utilise PostgreSQL pour stocker les données
- ✅ Les webhooks doivent être configurés dans Stripe Dashboard
- ✅ En mode test, utiliser les clés `sk_test_...` et `pk_test_...`

## 🚀 Prochaines étapes

- [ ] Implémenter les remises et codes promo
- [ ] Ajouter la gestion des essais gratuits
- [ ] Implémenter les upgrades/downgrades de plan
- [ ] Ajouter les notifications de renouvellement
- [ ] Implémenter l'export des factures en PDF
- [ ] Ajouter les statistiques d'utilisation des quotas

---

**Service développé pour Yemma Solutions**
