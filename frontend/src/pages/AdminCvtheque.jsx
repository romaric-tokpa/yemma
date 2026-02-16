/**
 * Page CVthèque admin — recherche et consultation des candidats validés.
 * Design aligné sur le dashboard admin.
 */
import { useNavigate } from 'react-router-dom'
import { Search, Users, CheckCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdminLayout from '@/components/admin/AdminLayout'
import { SearchTab } from '@/components/company/SearchTab'

export default function AdminCvtheque() {
  const navigate = useNavigate()

  return (
    <AdminLayout>
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        {/* Hero */}
        <div className="shrink-0 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2C2C2C] font-heading tracking-tight">
            CVthèque
          </h1>
          <p className="text-sm sm:text-base text-[#6b7280] mt-1 sm:mt-2 max-w-2xl">
            Recherchez et consultez les profils candidats validés.
          </p>
        </div>

        {/* Bandeau — aligné dashboard */}
        <div className="shrink-0 mb-4 sm:mb-6 rounded-xl sm:rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#F4F6F8] p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                <div className="absolute inset-0 rounded-xl bg-[#226D68]/15 flex items-center justify-center">
                  <Search className="h-7 w-7 sm:h-8 sm:w-8 text-[#226D68]" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-[#2C2C2C] text-sm sm:text-base">Recherche avancée</p>
                <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
                  Filtrez par poste, secteur, expérience, compétences et plus.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E8F4F3] text-[#226D68]">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                Profils validés uniquement
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/validation', { state: { status: 'VALIDATED' } })}
                className="h-8 sm:h-7 sm:px-3 rounded-lg border-gray-200 text-[#226D68] hover:bg-[#226D68]/10 shrink-0"
              >
                <Users className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Voir la validation</span>
                <ChevronRight className="h-4 w-4 sm:ml-0.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Zone de recherche — prend le reste de l'espace */}
        <div className="flex-1 min-h-0 rounded-xl sm:rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col">
          <SearchTab />
        </div>
      </div>
    </AdminLayout>
  )
}
