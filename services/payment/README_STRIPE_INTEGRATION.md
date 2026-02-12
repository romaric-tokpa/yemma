# Intégration Stripe - Abonnements

Configuration complète de l'intégration Stripe pour les abonnements avec protection des ressources.

## Modèle de données

### Subscription

La table `subscriptions` stocke :
- `stripe_customer_id`: ID du client Stripe
- `stripe_subscription_id`: ID de l'abonnement Stripe
- `plan_id`: Référence vers la table `plans` (qui contient `plan_type`)
- `status`: Statut de l'abonnement (active, trialing, canceled, past_due, unpaid)

**Note**: Le `plan_type` (FREEMIUM, PRO, ENTERPRISE) est stocké dans la table `plans`, pas directement dans `subscriptions`.

## Endpoints

### POST /api/v1/payments/create-checkout-session

Crée une session de checkout Stripe et redirige l'entreprise vers Stripe pour payer.

**Body:**
```json
{
  "company_id": 1,
  "plan_id": 2,
  "billing_period": "monthly"  // ou "yearly"
}
```

**Réponse:**
```json
{
  "session_id": "cs_test_...",
  "url": "https://checkout.stripe.com/...",
  "company_id": 1,
  "plan_id": 2
}
```

**Usage:**
```bash
curl -X POST http://localhost:8006/api/v1/payments/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "plan_id": 2,
    "billing_period": "monthly"
  }'
```

L'entreprise est redirigée vers l'URL retournée pour compléter le paiement.

### POST /api/v1/webhooks/webhook

Écoute les événements Stripe pour mettre à jour le statut en base de données.

**Événements gérés:**
- `checkout.session.completed`: Crée l'abonnement après paiement réussi
- `invoice.paid`: Met à jour le paiement et génère la facture
- `customer.subscription.updated`: Met à jour l'abonnement (statut, dates)
- `customer.subscription.deleted`: Annule l'abonnement

**Configuration Stripe:**
1. Aller dans Stripe Dashboard > Developers > Webhooks
2. Ajouter un endpoint : `https://your-domain.com/api/v1/webhooks/webhook`
3. Sélectionner les événements :
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Récupérer le secret du webhook et l'ajouter à `STRIPE_WEBHOOK_SECRET`

## Protection des ressources

### Décorateur @require_subscription

Protège un endpoint en vérifiant qu'une entreprise a un abonnement actif avec un plan suffisant.

#### Méthode 1 : Décorateur (recommandé pour les endpoints simples)

```python
from app.infrastructure.subscription_decorator import require_subscription
from app.domain.models import PlanType
from services.company.app.infrastructure.company_middleware import get_current_company

@router.get("/candidates")
@require_subscription(plan=PlanType.PRO)
async def search_candidates(
    company = Depends(get_current_company),
    session: AsyncSession = Depends(get_session)
):
    # L'abonnement est vérifié automatiquement
    # Si l'entreprise n'a pas un plan PRO ou supérieur, une HTTPException 403 est levée
    return {"candidates": [...]}
```

#### Méthode 2 : Dependency FastAPI (recommandé pour plus de flexibilité)

```python
from app.infrastructure.subscription_dependency import require_subscription_plan
from app.domain.models import PlanType
from services.company.app.infrastructure.company_middleware import get_current_company

@router.get("/candidates")
async def search_candidates(
    company = Depends(get_current_company),
    subscription = Depends(require_subscription_plan(PlanType.PRO)),
    session: AsyncSession = Depends(get_session)
):
    # subscription contient l'objet Subscription
    # Vous pouvez accéder à subscription.plan_id, subscription.status, etc.
    return {"candidates": [...]}
```

#### Méthode 3 : Dependency avec company_id explicite

```python
from app.infrastructure.subscription_dependency import require_subscription
from app.domain.models import PlanType

@router.get("/candidates")
async def search_candidates(
    company_id: int,
    subscription = Depends(lambda cid: require_subscription(cid, plan=PlanType.PRO)),
    session: AsyncSession = Depends(get_session)
):
    # subscription contient l'objet Subscription
    return {"candidates": [...]}
```

## Exemples d'utilisation

### Endpoint de recherche avec protection PRO

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.subscription_dependency import require_subscription_plan
from app.domain.models import PlanType
from services.company.app.infrastructure.company_middleware import get_current_company
from app.infrastructure.database import get_session

router = APIRouter()

@router.get("/api/v1/search/candidates")
async def search_candidates(
    company = Depends(get_current_company),
    subscription = Depends(require_subscription_plan(PlanType.PRO)),
    session: AsyncSession = Depends(get_session)
):
    """
    Recherche de candidats - Requiert un plan PRO ou supérieur
    """
    # L'abonnement est vérifié automatiquement
    # Si l'entreprise n'a pas PRO ou ENTERPRISE, une exception 403 est levée
    
    # Vous pouvez utiliser subscription pour accéder aux informations
    # subscription.plan_id, subscription.status, etc.
    
    return {
        "candidates": [...],
        "subscription_plan": subscription.plan.plan_type.value
    }
```

### Endpoint avec plan minimum FREEMIUM

```python
@router.get("/api/v1/candidates/{candidate_id}")
async def get_candidate_profile(
    candidate_id: int,
    company = Depends(get_current_company),
    subscription = Depends(require_subscription_plan(PlanType.FREEMIUM)),
    session: AsyncSession = Depends(get_session)
):
    """
    Voir un profil candidat - Requiert au moins FREEMIUM
    """
    # Tous les plans peuvent accéder (FREEMIUM, PRO, ENTERPRISE)
    return {"candidate": {...}}
```

### Endpoint avec plan ENTERPRISE uniquement

```python
@router.get("/api/v1/candidates/{candidate_id}/documents")
async def get_candidate_documents(
    candidate_id: int,
    company = Depends(get_current_company),
    subscription = Depends(require_subscription_plan(PlanType.ENTERPRISE)),
    session: AsyncSession = Depends(get_session)
):
    """
    Télécharger les documents - Requiert ENTERPRISE
    """
    # Seul ENTERPRISE peut accéder
    return {"documents": [...]}
```

## Hiérarchie des plans

Les plans sont ordonnés par niveau :
1. **FREEMIUM** (niveau 1)
2. **PRO** (niveau 2)
3. **ENTERPRISE** (niveau 3)

Un plan de niveau supérieur peut accéder aux fonctionnalités des plans inférieurs.

## Gestion des erreurs

### Pas d'abonnement actif
```json
{
  "detail": "No active subscription found. Please subscribe to access this feature."
}
```
**Status:** 403 Forbidden

### Plan insuffisant
```json
{
  "detail": "This feature requires a PRO plan or higher. Your current plan is FREEMIUM."
}
```
**Status:** 403 Forbidden

### Abonnement expiré
```json
{
  "detail": "Subscription is cancelled. Please renew your subscription."
}
```
**Status:** 403 Forbidden

## Statuts d'abonnement acceptés

Les statuts suivants sont considérés comme valides :
- `active`: Abonnement actif
- `trialing`: En période d'essai

Les statuts suivants bloquent l'accès :
- `cancelled`: Abonnement annulé
- `past_due`: Paiement en retard
- `unpaid`: Non payé

## Intégration avec le Company Service

Le décorateur `@require_subscription` fonctionne avec `get_current_company` du Company Service :

```python
from services.company.app.infrastructure.company_middleware import get_current_company
from app.infrastructure.subscription_dependency import require_subscription_plan
from app.domain.models import PlanType

@router.get("/candidates")
async def search_candidates(
    company = Depends(get_current_company),  # Récupère l'entreprise de l'utilisateur
    subscription = Depends(require_subscription_plan(PlanType.PRO)),  # Vérifie l'abonnement
):
    # company.id est automatiquement utilisé pour vérifier l'abonnement
    ...
```

## Configuration

Variables d'environnement requises :

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=eur

# Essai gratuit (en jours, 0 = pas d'essai)
TRIAL_DAYS=3

# Frontend URL (pour les redirections après paiement)
FRONTEND_URL=http://localhost:3000
```

## Essai gratuit et coordonnées bancaires

- **TRIAL_DAYS** : Nombre de jours d'essai gratuit (par défaut 3). L'utilisateur renseigne ses coordonnées bancaires sur Stripe Checkout ; aucun prélèvement n'est effectué avant la fin de l'essai.
- **Facturation automatique** : Après la période d'essai, Stripe prélève automatiquement le montant selon le plan choisi.

## Notes importantes

1. **Sécurité**: Le webhook vérifie la signature Stripe pour éviter les appels frauduleux
2. **Idempotence**: Les webhooks sont idempotents (gestion des doublons)
3. **Isolation**: Chaque entreprise ne peut accéder qu'à ses propres données
4. **Plan par défaut**: Les entreprises sans abonnement ont automatiquement FREEMIUM (à implémenter)

