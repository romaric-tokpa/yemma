/**
 * Page Raccourcis : grille des 6 cartes (Candidats soumis/validés/rejetés, Statistiques, CVthèque, Entreprises).
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { candidateApi, companyApi } from '@/services/api'
import AdminLayout from '@/components/admin/AdminLayout'
import { Clock, CheckCircle, XCircle, BarChart3, Search, Building } from 'lucide-react'

export default function AdminRaccourcisPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ DRAFT: 0, SUBMITTED: 0, IN_REVIEW: 0, VALIDATED: 0, REJECTED: 0, ARCHIVED: 0 })
  const [companies, setCompanies] = useState([])

  const loadStats = async () => {
    try {
      const statsData = await candidateApi.getProfileStats()
      if (statsData && typeof statsData === 'object') {
        setStats({
          DRAFT: parseInt(statsData.DRAFT) || 0,
          SUBMITTED: parseInt(statsData.SUBMITTED) || 0,
          IN_REVIEW: parseInt(statsData.IN_REVIEW) || 0,
          VALIDATED: parseInt(statsData.VALIDATED) || 0,
          REJECTED: parseInt(statsData.REJECTED) || 0,
          ARCHIVED: parseInt(statsData.ARCHIVED) || 0,
        })
        return
      }
    } catch {}
    const statuses = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'VALIDATED', 'REJECTED', 'ARCHIVED']
    const results = await Promise.all(statuses.map(async (status) => {
      try {
        const r = await candidateApi.listProfiles(status, 1, 10000)
        return { status, count: Array.isArray(r) ? r.length : (r?.items?.length ?? 0) }
      } catch {
        return { status, count: 0 }
      }
    }))
    const newStats = {}
    results.forEach(({ status, count }) => { newStats[status] = count })
    setStats(newStats)
  }

  const loadCompanies = async () => {
    try {
      const data = await companyApi.listCompanies()
      setCompanies(data || [])
    } catch {
      setCompanies([])
    }
  }

  useEffect(() => {
    loadStats()
    loadCompanies()
  }, [])

  const items = [
    { id: 'SUBMITTED', icon: Clock, label: 'Candidats soumis', value: stats.SUBMITTED || 0, desc: 'En attente de validation', action: () => navigate('/admin/validation', { state: { status: 'SUBMITTED' } }), done: (stats.SUBMITTED || 0) > 0 },
    { id: 'VALIDATED', icon: CheckCircle, label: 'Candidats validés', value: stats.VALIDATED || 0, desc: 'Visibles dans la CVthèque', action: () => navigate('/admin/validation', { state: { status: 'VALIDATED' } }), done: (stats.VALIDATED || 0) > 0 },
    { id: 'REJECTED', icon: XCircle, label: 'Candidats rejetés', value: stats.REJECTED || 0, desc: 'Profils refusés', action: () => navigate('/admin/validation', { state: { status: 'REJECTED' } }), done: (stats.REJECTED || 0) > 0 },
    { id: 'stats', icon: BarChart3, label: 'Statistiques', value: '', desc: 'Effectifs et secteurs', action: () => navigate('/admin/statistics'), done: true },
    { id: 'cvtheque', icon: Search, label: 'CVthèque', value: '', desc: 'Recherche dans les profils validés', action: () => navigate('/admin/cvtheque'), done: true },
    { id: 'companies', icon: Building, label: 'Entreprises', value: companies.length, desc: 'Annuaire des partenaires', action: () => navigate('/admin/companies'), done: companies.length > 0 },
  ]

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] font-heading tracking-tight">Raccourcis</h1>
        <p className="text-[#6b7280] mt-2 max-w-2xl">
          Accès rapide aux candidats, statistiques, CVthèque et entreprises.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="group text-left rounded-xl border border-gray-200 bg-white p-5 hover:border-[#226D68]/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.done ? 'bg-[#E8F4F3]' : 'bg-gray-100 group-hover:bg-[#E8F4F3]'}`}>
                  <Icon className={`h-6 w-6 ${item.done ? 'text-[#226D68]' : 'text-[#6b7280] group-hover:text-[#226D68]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2C2C2C] text-sm mb-1">{item.label}</p>
                  <p className={`text-xs font-medium mb-1 ${item.done ? 'text-[#226D68]' : 'text-amber-600'}`}>
                    {typeof item.value === 'number' ? item.value : item.value || '—'}
                  </p>
                  <p className="text-xs text-[#6b7280]">{item.desc}</p>
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-[#226D68] opacity-0 group-hover:opacity-100 transition-opacity">
                    Voir →
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </AdminLayout>
  )
}
