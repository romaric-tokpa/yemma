import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PaymentSuccess() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirection automatique après 5 secondes vers la gestion (onglet Abonnement)
    const timer = setTimeout(() => {
      navigate('/company/dashboard?tab=management&subtab=subscription')
    }, 5000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-[#E8F4F3] flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-[#226D68]" />
        </div>
        <h1 className="text-xl font-semibold text-[#2C2C2C] mb-2">
          Paiement enregistré avec succès
        </h1>
        <p className="text-sm text-[#9ca3af] mb-4">
          Votre abonnement est actif. Vous pouvez commencer à utiliser toutes les fonctionnalités de votre plan.
        </p>
        <Button
          onClick={() => navigate('/company/dashboard?tab=management&subtab=subscription')}
          className="bg-[#226D68] hover:bg-[#1a5a55]"
        >
          Retour à la gestion
        </Button>
      </div>
    </div>
  )
}
