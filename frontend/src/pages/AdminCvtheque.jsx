import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchTab } from '@/components/company/SearchTab'

/**
 * Page CVthèque pour l'administrateur - accès identique à l'entreprise
 * Permet de rechercher et consulter les candidats validés
 */
export default function AdminCvtheque() {
  const navigate = useNavigate()

  return (
    <div className="h-screen bg-[#F4F6F8] flex flex-col overflow-hidden">
      {/* Barre supérieure compacte */}
      <div className="shrink-0 bg-white border-b border-[#e5e7eb] px-4 py-2.5 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/dashboard')}
          className="text-[#2C2C2C] hover:bg-[#F4F6F8] -ml-1"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Retour admin
        </Button>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-[#2C2C2C]">CVthèque</h1>
          <p className="text-xs text-[#9ca3af]">Recherche et consultation des candidats validés</p>
        </div>
      </div>

      {/* Contenu : SearchTab identique à l'entreprise */}
      <div className="flex-1 overflow-hidden min-h-0">
        <SearchTab />
      </div>
    </div>
  )
}
