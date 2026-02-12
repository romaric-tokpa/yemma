import { useState, useEffect } from 'react'
import { Check, Crown, Zap, CreditCard } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
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
      // 404 = pas d'abonnement (plan gratuit)
      if (error.response?.status === 404) {
        setSubscription(null)
      } else {
        console.error('Error loading subscription:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadPlans = async () => {
    try {
      const data = await paymentApi.getPlans()
      const list = Array.isArray(data) ? data : (data?.data ?? [])
      setPlans(list.filter(p => p?.plan_type !== 'FREEMIUM'))
    } catch (error) {
      console.error('Error loading plans:', error)
      setPlans([])
    }
  }

  const handleUpgrade = async (planId, billingPeriod = 'monthly') => {
    try {
      const checkout = await paymentApi.createCheckoutSession({
        company_id: companyId,
        plan_id: planId,
        billing_period: billingPeriod
      })
      window.location.href = checkout.url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Erreur lors de la création de la session de paiement')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <span className="text-xs text-[#9ca3af]">Chargement...</span>
      </div>
    )
  }

  const currentPlan = subscription?.plan || { plan_type: 'FREEMIUM', name: 'Gratuit' }
  const isFreePlan = currentPlan.plan_type === 'FREEMIUM'

  return (
    <div className="space-y-4">
      {/* Plan actuel compact */}
      <Card className="border-[#e5e7eb] shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E8F4F3] flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#226D68]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#2C2C2C]">Plan actuel</p>
                <p className="text-xs text-[#9ca3af] mt-0.5">
                  {subscription?.status === 'trialing'
                    ? 'Essai gratuit en cours'
                    : subscription?.status === 'active'
                      ? 'Abonnement actif'
                      : 'Plan gratuit'}
                  {subscription?.current_period_end && (
                    <span> • {subscription?.status === 'trialing' ? 'Fin d\'essai' : 'Renouvellement'} le {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}</span>
                  )}
                </p>
              </div>
            </div>
            <Badge className={isFreePlan ? 'bg-[#9ca3af]' : 'bg-[#226D68]'}>
              {currentPlan.name}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Plans payants si gratuit */}
      {isFreePlan && plans.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide mb-3">Passer au plan supérieur</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[...plans].sort((a, b) => a.name === 'Essentiel' ? -1 : b.name === 'Essentiel' ? 1 : 0).map((plan) => (
              <Card
                key={plan.id}
                className={`border shadow-none overflow-hidden transition-colors hover:border-[#226D68]/40 ${
                  plan.name === 'Essentiel' ? 'border-[#226D68] ring-1 ring-[#226D68]/20' : 'border-[#e5e7eb]'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {plan.plan_type === 'ENTERPRISE' && plan.name !== 'Essentiel' ? (
                        <Crown className="w-4 h-4 text-amber-500" />
                      ) : plan.plan_type === 'PRO' && plan.name !== 'Essentiel' ? (
                        <Zap className="w-4 h-4 text-blue-500" />
                      ) : null}
                      <span className="text-sm font-semibold text-[#2C2C2C]">{plan.name}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] text-[#226D68] font-medium mb-1">3 jours d'essai gratuit</p>
                    <p className="text-[10px] text-[#9ca3af] mb-1">Puis facturation automatique</p>
                    {plan.name === 'Essentiel' ? (
                      <>
                        <span className="text-xl font-bold text-[#2C2C2C]">
                          {Math.round(plan.price_monthly * 655).toLocaleString('fr-FR')} FCFA
                        </span>
                        <span className="text-xs text-[#9ca3af]">/mois</span>
                        {plan.price_yearly && (
                          <p className="text-[10px] text-[#9ca3af] mt-1">
                            ou {Math.round(plan.price_yearly * 655).toLocaleString('fr-FR')} FCFA/an
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-bold text-[#2C2C2C]">{plan.price_monthly.toFixed(2)}€</span>
                        <span className="text-xs text-[#9ca3af]">/mois</span>
                        {plan.price_yearly && (
                          <p className="text-[10px] text-[#9ca3af] mt-1">
                            ou {plan.price_yearly.toFixed(2)}€/an
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-1.5 mb-4">
                    {plan.unlimited_search && (
                      <li className="flex items-center gap-2 text-xs text-[#2C2C2C]">
                        <Check className="w-3.5 h-3.5 text-[#226D68] flex-shrink-0" />
                        Recherche illimitée
                      </li>
                    )}
                    {plan.max_profile_views === null ? (
                      <li className="flex items-center gap-2 text-xs text-[#2C2C2C]">
                        <Check className="w-3.5 h-3.5 text-[#226D68] flex-shrink-0" />
                        Consultations illimitées
                      </li>
                    ) : (
                      <li className="flex items-center gap-2 text-xs text-[#2C2C2C]">
                        <Check className="w-3.5 h-3.5 text-[#226D68] flex-shrink-0" />
                        {plan.max_profile_views} consultations/mois
                      </li>
                    )}
                    {plan.document_access && (
                      <li className="flex items-center gap-2 text-xs text-[#2C2C2C]">
                        <Check className="w-3.5 h-3.5 text-[#226D68] flex-shrink-0" />
                        Accès aux documents
                      </li>
                    )}
                    {plan.multi_accounts && (
                      <li className="flex items-center gap-2 text-xs text-[#2C2C2C]">
                        <Check className="w-3.5 h-3.5 text-[#226D68] flex-shrink-0" />
                        Multi-comptes recruteurs
                      </li>
                    )}
                  </ul>

                  <p className="text-[10px] text-[#9ca3af] mb-2">
                    Coordonnées bancaires requises pour la facturation
                  </p>
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs"
                    variant={plan.name === 'Essentiel' ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(plan.id, 'monthly')}
                  >
                    {plan.name === 'Essentiel' ? 'Choisir' : 'Passer au plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Détails si plan payant */}
      {!isFreePlan && subscription && (
        <Card className="border-[#e5e7eb] shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide mb-3">Détails</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-[#9ca3af]">Statut</p>
                <p className="font-medium text-[#2C2C2C] capitalize">{subscription.status}</p>
              </div>
              {subscription.current_period_start && (
                <div>
                  <p className="text-[#9ca3af]">Période</p>
                  <p className="font-medium text-[#2C2C2C]">
                    {new Date(subscription.current_period_start).toLocaleDateString('fr-FR')} → {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              {subscription.quota_limit != null && (
                <div>
                  <p className="text-[#9ca3af]">Quota</p>
                  <p className="font-medium text-[#2C2C2C]">
                    {subscription.quota_used || 0} / {subscription.quota_limit || '∞'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
