import { useState, useEffect } from 'react'
import { Check, Crown, Zap, MapPin } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { paymentApi } from '../../services/api'

export function SubscriptionTab({ companyId, onUpdate }) {
  const [subscription, setSubscription] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (companyId) {
      loadSubscription()
      loadPlans()
    }
  }, [companyId])

  const loadSubscription = async () => {
    try {
      const data = await paymentApi.getCompanySubscription(companyId)
      setSubscription(data)
    } catch (error) {
      console.error('Error loading subscription:', error)
      // Si pas d'abonnement, subscription reste null (plan gratuit)
    } finally {
      setLoading(false)
    }
  }

  const loadPlans = async () => {
    try {
      const data = await paymentApi.getPlans()
      console.log('Plans chargés depuis l\'API:', data)
      const filteredPlans = data.filter(p => p.plan_type !== 'FREEMIUM')
      console.log('Plans filtrés (sans FREEMIUM):', filteredPlans)
      setPlans(filteredPlans)
    } catch (error) {
      console.error('Error loading plans:', error)
    }
  }

  const handleUpgrade = async (planId, billingPeriod = 'monthly') => {
    try {
      const checkout = await paymentApi.createCheckoutSession({
        company_id: companyId,
        plan_id: planId,
        billing_period: billingPeriod
      })
      // Rediriger vers Stripe
      window.location.href = checkout.url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Erreur lors de la création de la session de paiement')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>
  }

  const currentPlan = subscription?.plan || { plan_type: 'FREEMIUM', name: 'Gratuit' }
  const isFreePlan = currentPlan.plan_type === 'FREEMIUM'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Abonnement</h2>
        <p className="text-gray-600 mt-1">
          Gérez votre plan d'abonnement et accédez à plus de fonctionnalités
        </p>
      </div>

      {/* Plan actuel */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold">Plan actuel</h3>
              <Badge variant={isFreePlan ? 'secondary' : 'default'}>
                {currentPlan.name}
              </Badge>
            </div>
            <p className="text-gray-600">
              {subscription?.status === 'active' ? 'Abonnement actif' : 'Plan gratuit'}
              {subscription?.current_period_end && (
                <span className="ml-2">
                  • Renouvellement le {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                </span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Cartes de prix si plan gratuit */}
      {isFreePlan && (
        <div>
          <h3 className="text-lg font-semibold mb-6">Passer au plan supérieur</h3>
          {/* Trier les plans : Essentiel en premier, puis les autres */}
          <div className="grid md:grid-cols-2 gap-6">
            {[...plans].sort((a, b) => {
              if (a.name === 'Essentiel') return -1
              if (b.name === 'Essentiel') return 1
              return 0
            }).map((plan) => (
              <Card 
                key={plan.id} 
                className={`p-6 relative transition-all hover:shadow-lg ${
                  plan.plan_type === 'ENTERPRISE' ? 'border-2 border-yellow-400' : 
                  plan.name === 'Essentiel' ? 'border-2 border-[#226D68]' : ''
                }`}
              >
                {plan.name === 'Essentiel' && (
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <MapPin className="h-5 w-5 text-[#226D68]" />
                    <Badge className="bg-[#226D68] text-white text-xs">Côte d'Ivoire</Badge>
                  </div>
                )}
                {plan.plan_type === 'ENTERPRISE' && plan.name !== 'Essentiel' && (
                  <div className="absolute top-4 right-4">
                    <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  </div>
                )}
                {plan.plan_type === 'PRO' && plan.name !== 'Essentiel' && (
                  <div className="absolute top-4 right-4">
                    <Zap className="h-6 w-6 text-blue-500 fill-blue-500" />
                  </div>
                )}
                
                <div className="mb-6">
                  <h4 className="text-2xl font-bold mb-2 text-gray-900">{plan.name}</h4>
                  {plan.name === "Essentiel" ? (
                    // Affichage en FCFA pour le plan Essentiel (marché ivoirien)
                    <>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-bold text-gray-900">
                          {Math.round(plan.price_monthly * 655).toLocaleString('fr-FR')} FCFA
                        </span>
                        <span className="text-gray-600 text-lg">/mois</span>
                      </div>
                      {plan.price_yearly && (
                        <p className="text-sm text-gray-600">
                          ou <span className="font-semibold">{Math.round(plan.price_yearly * 655).toLocaleString('fr-FR')} FCFA/an</span>
                          <span className="text-[#226D68] ml-2">
                            (économisez {((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12) * 100).toFixed(0)}%)
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        (≈ {plan.price_monthly.toFixed(2)}€/mois)
                      </p>
                    </>
                  ) : (
                    // Affichage en EUR pour les autres plans
                    <>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-bold text-gray-900">
                          {plan.price_monthly.toFixed(2)}€
                        </span>
                        <span className="text-gray-600 text-lg">/mois</span>
                      </div>
                      {plan.price_yearly && (
                        <p className="text-sm text-gray-600">
                          ou <span className="font-semibold">{plan.price_yearly.toFixed(2)}€/an</span>
                          <span className="text-[#226D68] ml-2">
                            (économisez {((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12) * 100).toFixed(0)}%)
                          </span>
                        </p>
                      )}
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.unlimited_search && (
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-5 w-5 text-[#226D68] flex-shrink-0" />
                      <span>Recherche illimitée</span>
                    </li>
                  )}
                  {plan.max_profile_views === null ? (
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-5 w-5 text-[#226D68] flex-shrink-0" />
                      <span>Consultations illimitées</span>
                    </li>
                  ) : (
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-5 w-5 text-[#226D68] flex-shrink-0" />
                      <span>{plan.max_profile_views} consultations/mois</span>
                    </li>
                  )}
                  {plan.document_access && (
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-5 w-5 text-[#226D68] flex-shrink-0" />
                      <span>Accès aux documents</span>
                    </li>
                  )}
                  {plan.multi_accounts && (
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-5 w-5 text-[#226D68] flex-shrink-0" />
                      <span>Multi-comptes recruteurs</span>
                    </li>
                  )}
                </ul>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleUpgrade(plan.id, 'monthly')}
                  variant={plan.name === 'Essentiel' ? 'default' : 'outline'}
                >
                  {plan.name === 'Essentiel' ? 'Choisir ce plan' : 'Passer au plan supérieur'}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Informations supplémentaires si plan payant */}
      {!isFreePlan && subscription && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Détails de l'abonnement</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Statut</p>
              <p className="font-semibold capitalize">{subscription.status}</p>
            </div>
            {subscription.current_period_start && (
              <div>
                <p className="text-gray-600">Période actuelle</p>
                <p className="font-semibold">
                  {new Date(subscription.current_period_start).toLocaleDateString('fr-FR')} - {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
            {subscription.quota_limit !== null && (
              <div>
                <p className="text-gray-600">Quota utilisé</p>
                <p className="font-semibold">
                  {subscription.quota_used || 0} / {subscription.quota_limit || '∞'}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

