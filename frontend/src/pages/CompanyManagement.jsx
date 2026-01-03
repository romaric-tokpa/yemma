import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { TeamTab } from '../components/company/TeamTab'
import { SubscriptionTab } from '../components/company/SubscriptionTab'
import { HistoryTab } from '../components/company/HistoryTab'
import { companyApi } from '../services/api'

export function CompanyManagement() {
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestion de l'entreprise</h1>
          <p className="text-gray-600 mt-2">
            Gérez votre équipe, votre abonnement et consultez l'historique
          </p>
        </div>

        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="team">Équipe</TabsTrigger>
            <TabsTrigger value="subscription">Abonnement</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="mt-6">
            <TeamTab companyId={company?.id} onUpdate={loadCompany} />
          </TabsContent>

          <TabsContent value="subscription" className="mt-6">
            <SubscriptionTab companyId={company?.id} onUpdate={loadCompany} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <HistoryTab companyId={company?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

