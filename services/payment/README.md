# Payment Service

Service de gestion des paiements et abonnements avec intégration Stripe.

## Fonctionnalités

- ✅ Intégration Stripe complète
- ✅ Webhooks Stripe (checkout.session.completed, invoice.paid)
- ✅ Gestion de 3 plans : Freemium, Pro, Enterprise
- ✅ Système de quotas avec décrémentation
- ✅ Gestion des abonnements et paiements
- ✅ Génération automatique de factures

## Architecture

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
│       └── seed.py           # Seed des plans
├── Dockerfile
├── requirements.txt
└── README.md
```

## Modèles de données

### Plan
- `id`, `name`, `plan_type` (FREEMIUM, PRO, ENTERPRISE)
- `price_monthly`, `price_yearly`
- `max_profile_views` (None = illimité)
- `unlimited_search`, `document_access`, `multi_accounts`
- `stripe_price_id_monthly`, `stripe_price_id_yearly`

### Subscription
- `id`, `company_id`, `plan_id`
- `status` (active, cancelled, past_due, unpaid, trialing)
- `stripe_subscription_id`, `stripe_customer_id`
- `current_period_start`, `current_period_end`

### Payment
- `id`, `subscription_id`, `amount`, `currency`
- `status` (pending, succeeded, failed, refunded)
- `stripe_payment_intent_id`, `stripe_checkout_session_id`

### Quota
- `id`, `subscription_id`, `quota_type`
- `limit`, `used`
- `period_start`, `period_end`

## Plans disponibles

### Freemium
- Prix : 0€/mois
- 10 consultations de profils/mois
- Recherche limitée
- Pas d'accès aux documents
- Pas de multi-comptes

### Pro
- Prix : 49.99€/mois ou 499.99€/an
- Consultations illimitées
- Recherche illimitée
- Pas d'accès aux documents
- Pas de multi-comptes

### Enterprise
- Prix : 199.99€/mois ou 1999.99€/an
- Consultations illimitées
- Recherche illimitée
- Accès aux documents
- Multi-comptes recruteurs

## Endpoints

### Plans
- `GET /api/v1/plans` - Liste des plans actifs
- `GET /api/v1/plans/{plan_id}` - Détails d'un plan

### Abonnements
- `GET /api/v1/subscriptions/company/{company_id}` - Abonnement d'une entreprise

### Paiements
- `POST /api/v1/payments/checkout` - Créer une session de checkout Stripe
  ```json
  {
    "company_id": 1,
    "plan_id": 2,
    "billing_period": "monthly" // ou "yearly"
  }
  ```

### Webhooks
- `POST /api/v1/webhooks/stripe` - Webhook Stripe
  - Événements gérés :
    - `checkout.session.completed` : Crée l'abonnement
    - `invoice.paid` : Met à jour le paiement et génère la facture
    - `customer.subscription.updated` : Met à jour l'abonnement
    - `customer.subscription.deleted` : Annule l'abonnement

### Quotas
- `POST /api/v1/quotas/check` - Vérifier un quota
  ```json
  {
    "company_id": 1,
    "quota_type": "profile_views"
  }
  ```
  
- `POST /api/v1/quotas/use` - Utiliser un quota (décrémenter)
  ```json
  {
    "company_id": 1,
    "quota_type": "profile_views",
    "amount": 1
  }
  ```

## Configuration

Variables d'environnement requises :

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
DB_NAME=yemma_db

# Service URLs
COMPANY_SERVICE_URL=http://company:8000
FRONTEND_URL=http://localhost:3000
```

## Configuration Stripe

1. Créer un compte Stripe
2. Récupérer les clés API (Dashboard > Developers > API keys)
3. Créer les produits et prix dans Stripe Dashboard
4. Configurer les webhooks :
   - URL : `https://your-domain.com/api/v1/webhooks/stripe`
   - Événements à écouter :
     - `checkout.session.completed`
     - `invoice.paid`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
5. Récupérer le secret du webhook et l'ajouter à `STRIPE_WEBHOOK_SECRET`

## Utilisation

### 1. Créer une session de checkout

```bash
curl -X POST http://localhost:8006/api/v1/payments/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "plan_id": 2,
    "billing_period": "monthly"
  }'
```

Réponse :
```json
{
  "session_id": "cs_test_...",
  "url": "https://checkout.stripe.com/...",
  "company_id": 1,
  "plan_id": 2
}
```

### 2. Vérifier un quota

```bash
curl -X POST http://localhost:8006/api/v1/quotas/check \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "quota_type": "profile_views"
  }'
```

Réponse :
```json
{
  "allowed": true,
  "used": 5,
  "limit": 10,
  "remaining": 5,
  "message": null
}
```

### 3. Utiliser un quota (lors de la consultation d'un profil)

```bash
curl -X POST http://localhost:8006/api/v1/quotas/use \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "quota_type": "profile_views",
    "amount": 1
  }'
```

## Intégration avec le Company Service

Le service payment notifie automatiquement le company service lors de l'activation d'un abonnement via webhook.

Le company service doit appeler le service payment pour :
- Vérifier les quotas avant d'afficher un profil complet
- Décrémenter le quota après consultation

## Développement

```bash
# Installer les dépendances
pip install -r requirements.txt

# Lancer le service
uvicorn app.main:app --reload --port 8006
```

## Tests

Les webhooks Stripe peuvent être testés localement avec Stripe CLI :

```bash
# Installer Stripe CLI
stripe listen --forward-to localhost:8006/api/v1/webhooks/stripe

# Déclencher un événement de test
stripe trigger checkout.session.completed
```

## Notes

- Les quotas sont réinitialisés chaque mois (période basée sur `current_period_start`)
- Les plans sont créés automatiquement au démarrage du service si ils n'existent pas
- Les factures sont générées automatiquement lors du paiement d'une facture Stripe
- Le service utilise PostgreSQL pour stocker les données

