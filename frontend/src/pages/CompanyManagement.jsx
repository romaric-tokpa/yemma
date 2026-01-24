import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { TeamTab } from '../components/company/TeamTab'
import { SubscriptionTab } from '../components/company/SubscriptionTab'
import { HistoryTab } from '../components/company/HistoryTab'
import { companyApi } from '../services/api'
import { Loader2 } from 'lucide-react'

export default function CompanyManagement() {
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompany()
  }, [])

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
      <div className="flex items-center justify-center h-screen bg-gray-light">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#226D68]" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-anthracite font-heading mb-2">
            Gestion de l'entreprise
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gérez votre équipe, votre abonnement et consultez l'historique
          </p>
        </div>

        <Tabs defaultValue="team" className="w-full">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <TabsList className="grid w-full grid-cols-3 bg-white border rounded-lg p-1 min-w-max sm:min-w-0">
              <TabsTrigger 
                value="team" 
                className="data-[state=active]:bg-[#226D68] data-[state=active]:text-white rounded-md text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap"
              >
                Équipe
              </TabsTrigger>
              <TabsTrigger 
                value="subscription"
                className="data-[state=active]:bg-[#226D68] data-[state=active]:text-white rounded-md text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap"
              >
                Abonnement
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="data-[state=active]:bg-[#226D68] data-[state=active]:text-white rounded-md text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap"
              >
                Historique
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="team" className="mt-4 sm:mt-6">
            <TeamTab companyId={company?.id} onUpdate={loadCompany} />
          </TabsContent>

          <TabsContent value="subscription" className="mt-4 sm:mt-6">
            <SubscriptionTab companyId={company?.id} onUpdate={loadCompany} />
          </TabsContent>

          <TabsContent value="history" className="mt-4 sm:mt-6">
            <HistoryTab companyId={company?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
