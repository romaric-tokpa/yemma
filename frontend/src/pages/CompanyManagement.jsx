import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { TeamTab } from '../components/company/TeamTab'
import { SubscriptionTab } from '../components/company/SubscriptionTab'
import { HistoryTab } from '../components/company/HistoryTab'
import { companyApi } from '../services/api'
import { Loader2, Users, CreditCard, History } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

const pathToSubtab = (path) => {
  if (path.endsWith('/subscription')) return 'subscription'
  if (path.endsWith('/history')) return 'history'
  return 'team'
}

export default function CompanyManagement({ embedded }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const activeSubtab = pathToSubtab(location.pathname)

  useEffect(() => {
    loadCompany()
  }, [])

  const handleSubtabChange = (value) => {
    if (value === 'team') navigate(ROUTES.COMPANY_DASHBOARD_MANAGEMENT_TEAM)
    else if (value === 'subscription') navigate(ROUTES.COMPANY_DASHBOARD_MANAGEMENT_SUBSCRIPTION)
    else navigate(ROUTES.COMPANY_DASHBOARD_MANAGEMENT_HISTORY)
  }

  const loadCompany = async () => {
    try {
      const data = await companyApi.getMyCompany()
      setCompany(data)
    } catch (error) {
      console.error('Error loading company:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'py-12' : 'h-64'} bg-transparent`}>
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#226D68]" />
          <p className="text-xs text-[#9ca3af]">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={embedded ? '' : 'min-h-screen p-4'}>
      <div className={embedded ? '' : 'max-w-4xl mx-auto'}>
        {!embedded && (
          <div className="mb-4">
            <h1 className="text-lg font-semibold text-[#2C2C2C] font-[Poppins]">Gestion de l'entreprise</h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">Équipe, abonnement et historique</p>
          </div>
        )}

        <Tabs value={activeSubtab} onValueChange={handleSubtabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9 bg-white border border-[#e5e7eb] rounded-lg p-1 mb-4">
            <TabsTrigger
              value="team"
              className="rounded-md text-xs font-medium data-[state=active]:bg-[#226D68] data-[state=active]:text-white data-[state=inactive]:text-[#9ca3af]"
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Équipe
            </TabsTrigger>
            <TabsTrigger
              value="subscription"
              className="rounded-md text-xs font-medium data-[state=active]:bg-[#226D68] data-[state=active]:text-white data-[state=inactive]:text-[#9ca3af]"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Abonnement
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-md text-xs font-medium data-[state=active]:bg-[#226D68] data-[state=active]:text-white data-[state=inactive]:text-[#9ca3af]"
            >
              <History className="w-3.5 h-3.5 mr-1.5" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="mt-0">
            <TeamTab companyId={company?.id} onUpdate={loadCompany} />
          </TabsContent>

          <TabsContent value="subscription" className="mt-0">
            <SubscriptionTab companyId={company?.id} onUpdate={loadCompany} />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <HistoryTab companyId={company?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
