import { useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PaymentCancel() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-[#FDF2F0] flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-[#e76f51]" />
        </div>
        <h1 className="text-xl font-semibold text-[#2C2C2C] mb-2">
          Paiement annulé
        </h1>
        <p className="text-sm text-[#9ca3af] mb-4">
          Vous avez annulé le paiement. Aucun prélèvement n'a été effectué.
        </p>
        <Button
          onClick={() => navigate('/company/dashboard?tab=management')}
          variant="outline"
        >
          Retour à la gestion
        </Button>
      </div>
    </div>
  )
}
