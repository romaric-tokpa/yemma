# Gestion des Quotas Basée sur les Plans

## Vue d'ensemble

Le système de quotas gère l'utilisation des fonctionnalités selon le plan d'abonnement de l'entreprise (Freemium, Pro, Enterprise).

## Modèle Quota

Le modèle `Quota` stocke :
- `subscription_id` : ID de l'abonnement (lié à une entreprise)
- `quota_type` : Type de quota (ex: "profile_views")
- `limit` : Limite mensuelle (None = illimité)
- `used` : Nombre utilisé dans la période
- `period_start` : Début de la période (1er du mois)
- `period_end` : Fin de la période (dernier jour du mois)

**Note** : Pour obtenir `company_id`, on passe par `subscription.company_id`.

## Endpoint Principal

### POST /api/v1/quotas/check-and-use

**Description** : Vérifie et utilise un quota en une seule opération atomique

**Authentification** : Requis (token de service pour appels inter-services)

**Schéma de requête** :
```json
{
  "company_id": 1,
  "quota_type": "profile_views"
}
```

**Comportement** :

1. **Plans PRO et ENTERPRISE** : Autorise sans décrémenter (illimité)
   ```json
   {
     "allowed": true,
     "used": 0,
     "limit": null,
     "remaining": null,
     "message": "Unlimited quota for PRO plan"
   }
   ```

2. **Plan FREEMIUM** :
   - Si `views_remaining > 0` : Décrémente de 1 et autorise
   - Si `views_remaining = 0` : Retourne **403 Forbidden**
   
   **Réponse (succès)** :
   ```json
   {
     "allowed": true,
     "used": 5,
     "limit": 10,
     "remaining": 5,
     "message": "Quota used successfully. Remaining: 5"
   }
   ```
   
   **Réponse (quota atteint)** :
   ```json
   {
     "detail": "Quota atteint. Limite: 10, Utilisé: 10, Restant: 0"
   }
   ```
   **Status HTTP** : 403 Forbidden

## Logique de Décrémentation

### Plan FREEMIUM

```python
# Vérification
views_remaining = limit - current_used

if views_remaining > 0:
    # Décrémenter de 1
    quota.used += 1
    allowed = True
else:
    # Quota atteint
    allowed = False
    raise HTTPException(403, "Quota atteint")
```

### Plans PRO et ENTERPRISE

```python
# Pas de décrémentation, accès illimité
allowed = True
# Pas de modification du quota
```

## Réinitialisation Mensuelle des Quotas

### Webhook Stripe : `invoice.paid`

Lorsqu'une facture est payée (mensuellement), le webhook :

1. **Met à jour le paiement** et génère la facture
2. **Met à jour le statut de l'abonnement** à `ACTIVE`
3. **Réinitialise les quotas** pour la nouvelle période mensuelle

### Logique de Réinitialisation

```python
# Calculer la nouvelle période (mois suivant)
period_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
if period_start.month == 12:
    period_end = period_start.replace(year=period_start.year + 1, month=1)
else:
    period_end = period_start.replace(month=period_start.month + 1)

# Réinitialiser le quota
quota.used = 0  # Remettre à zéro
quota.period_start = period_start
quota.period_end = period_end
```

**Exemple** :
- Période actuelle : 1er janvier - 31 janvier (used: 8/10)
- Facture payée le 1er février
- Nouvelle période : 1er février - 28 février (used: 0/10)

## Plans et Limites

### Freemium
- **Prix** : 0€/mois
- **profile_views** : 10/mois
- **Réinitialisation** : Mensuelle (1er du mois)

### Pro
- **Prix** : 49.99€/mois ou 499.99€/an
- **profile_views** : Illimité (None)
- **Pas de décrémentation** : Accès toujours autorisé

### Enterprise
- **Prix** : 199.99€/mois ou 1999.99€/an
- **profile_views** : Illimité (None)
- **Pas de décrémentation** : Accès toujours autorisé

## Intégration avec le Service Recherche

Le service Recherche appelle cet endpoint avant d'afficher un profil complet :

```python
# Dans le service Recherche
async with httpx.AsyncClient() as client:
    response = await client.post(
        f"{PAYMENT_SERVICE_URL}/api/v1/quotas/check-and-use",
        json={
            "company_id": recruiter.company_id,
            "quota_type": "profile_views"
        },
        headers={"X-Service-Token": service_token}
    )
    
    if response.status_code == 403:
        # Quota atteint, ne pas afficher le profil
        raise HTTPException(403, "Quota atteint")
    
    # Quota disponible, afficher le profil
    quota_data = response.json()
    # ... afficher le profil ...
```

## Exemple d'utilisation

### Requête

```http
POST /api/v1/quotas/check-and-use
Content-Type: application/json
X-Service-Token: <service_token>

{
  "company_id": 1,
  "quota_type": "profile_views"
}
```

### Réponse (FREEMIUM avec quota disponible)

```json
{
  "allowed": true,
  "used": 3,
  "limit": 10,
  "remaining": 7,
  "message": "Quota used successfully. Remaining: 7"
}
```

### Réponse (FREEMIUM quota atteint)

```json
{
  "detail": "Quota atteint. Limite: 10, Utilisé: 10, Restant: 0"
}
```
**Status** : 403 Forbidden

### Réponse (PRO/ENTERPRISE)

```json
{
  "allowed": true,
  "used": 0,
  "limit": null,
  "remaining": null,
  "message": "Unlimited quota for PRO plan"
}
```

## Configuration du Webhook Stripe

### Événements à écouter

Dans Stripe Dashboard > Webhooks, configurer :

1. **Endpoint** : `https://your-domain.com/api/v1/webhooks/stripe`
2. **Événements** :
   - `invoice.paid` : Réinitialise les quotas mensuellement
   - `checkout.session.completed` : Crée l'abonnement
   - `customer.subscription.updated` : Met à jour l'abonnement
   - `customer.subscription.deleted` : Annule l'abonnement

### Sécurité

- Vérification de la signature Stripe avec `stripe-signature` header
- Validation du payload avant traitement

## Notes importantes

1. **Opération atomique** : `check-and-use` vérifie et décrémente en une seule transaction
2. **Réinitialisation automatique** : Les quotas sont réinitialisés automatiquement chaque mois lors du paiement de la facture
3. **Plans illimités** : PRO et ENTERPRISE n'ont pas de limite, donc pas de décrémentation
4. **Période mensuelle** : Les quotas sont calculés du 1er au dernier jour du mois
5. **Cohérence** : Si le webhook échoue, les quotas ne sont pas réinitialisés (à gérer manuellement si nécessaire)

