import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { TeamTab } from '../components/company/TeamTab'
import { SubscriptionTab } from '../components/company/SubscriptionTab'
import { HistoryTab } from '../components/company/HistoryTab'
import { companyApi } from '../services/api'
import { Loader2, Users, CreditCard, History } from 'lucide-react'

export default function CompanyManagement({ embedded }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const subtabParam = searchParams.get('subtab')
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSubtab, setActiveSubtab] = useState(subtabParam === 'subscription' ? 'subscription' : subtabParam === 'history' ? 'history' : 'team')

  useEffect(() => {
    if (subtabParam === 'subscription' || subtabParam === 'history') {
      setActiveSubtab(subtabParam)
    }
  }, [subtabParam])

  useEffect(() => {
    loadCompany()
  }, [])

  const handleSubtabChange = (value) => {
    setActiveSubtab(value)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === 'team') next.delete('subtab')
      else next.set('subtab', value)
      return next
    })
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
    <div className={embedded ? '' : 'min-h-screen bg-[#F4F6F8] p-4'}>
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
