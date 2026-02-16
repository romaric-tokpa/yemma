/**
 * Page Statistiques admin : effectifs, secteurs, évolution.
 * Route dédiée : /admin/statistics
 * Responsive et redesign moderne.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { candidateApi } from '@/services/api'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Users, CheckCircle, Loader2, TrendingUp, RefreshCw, Calendar,
  BarChart3, PieChart, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, Archive
} from 'lucide-react'

export default function AdminStatisticsPage() {
  const navigate = useNavigate()
  const [profileStats, setProfileStats] = useState(null)
  const [statsBySector, setStatsBySector] = useState([])
  const [loadingStatsBySector, setLoadingStatsBySector] = useState(false)
  const [statsSortBy, setStatsSortBy] = useState('total')
  const [statsSortOrder, setStatsSortOrder] = useState('desc')
  const [statsByPeriod, setStatsByPeriod] = useState([])
  const [loadingStatsByPeriod, setLoadingStatsByPeriod] = useState(false)
  const [periodFilter, setPeriodFilter] = useState(() => {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(start.getMonth() - 12)
    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
      groupBy: 'month',
    }
  })
  const [statsTab, setStatsTab] = useState('overview')

  const loadStats = async () => {
    try {
      const [sectorData, statsData] = await Promise.all([
        candidateApi.getProfileStatsBySector(),
        candidateApi.getProfileStats(),
      ])
      setStatsBySector(Array.isArray(sectorData) ? sectorData : [])
      setProfileStats(statsData && typeof statsData === 'object' ? statsData : null)
    } catch {
      setStatsBySector([])
      setProfileStats(null)
    }
  }

  const loadStatsBySector = async () => {
    try {
      setLoadingStatsBySector(true)
      await loadStats()
    } finally {
      setLoadingStatsBySector(false)
    }
  }

  const loadStatsByPeriod = async (overrideFilter) => {
    const filter = overrideFilter || periodFilter
    try {
      setLoadingStatsByPeriod(true)
      const data = await candidateApi.getProfileStatsByPeriod(filter.from, filter.to, filter.groupBy)
      setStatsByPeriod(Array.isArray(data) ? data : [])
    } catch {
      setStatsByPeriod([])
    } finally {
      setLoadingStatsByPeriod(false)
    }
  }

  useEffect(() => {
    loadStatsBySector()
  }, [])

  useEffect(() => {
    if (statsTab === 'period') loadStatsByPeriod()
  }, [statsTab])

  const totalInscrits = statsBySector.reduce((s, r) => s + (r.total ?? 0), 0)
  const totalValidated = statsBySector.reduce((s, r) => s + (r.validated ?? 0), 0)
  const totalArchived = profileStats ? (parseInt(profileStats.ARCHIVED) || 0) : 0
  const validationRate = totalInscrits > 0 ? Math.round((totalValidated / totalInscrits) * 100) : 0
  const sectorCount = statsBySector.length

  const sortedRows = [...statsBySector].sort((a, b) => {
    let va = a.sector ?? '', vb = b.sector ?? ''
    if (statsSortBy === 'total') { va = a.total ?? 0; vb = b.total ?? 0 }
    else if (statsSortBy === 'validated') { va = a.validated ?? 0; vb = b.validated ?? 0 }
    else if (statsSortBy === 'archived') { va = a.archived ?? 0; vb = b.archived ?? 0 }
    else if (statsSortBy === 'rate') {
      va = (a.total ?? 0) > 0 ? ((a.validated ?? 0) / (a.total ?? 1)) * 100 : 0
      vb = (b.total ?? 0) > 0 ? ((b.validated ?? 0) / (b.total ?? 1)) * 100 : 0
    }
    if (typeof va === 'string') return statsSortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    return statsSortOrder === 'asc' ? va - vb : vb - va
  })

  const topByVolume = [...statsBySector].sort((a, b) => (b.total ?? 0) - (a.total ?? 0)).slice(0, 8)
  const topByRate = [...statsBySector]
    .filter(r => (r.total ?? 0) >= 1)
    .map(r => ({ ...r, rate: (r.total ?? 0) > 0 ? Math.round(((r.validated ?? 0) / (r.total ?? 1)) * 100) : 0 }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5)

  const toggleSort = (key) => {
    if (statsSortBy === key) setStatsSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setStatsSortBy(key); setStatsSortOrder(key === 'sector' ? 'asc' : 'desc') }
  }

  const SortIcon = ({ column }) => {
    if (statsSortBy !== column) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-50 inline" />
    return statsSortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 ml-1 inline" /> : <ArrowDown className="w-3.5 h-3.5 ml-1 inline" />
  }

  const periodPresets = [
    { label: '7j', getRange: () => { const e = new Date(); const s = new Date(e); s.setDate(s.getDate() - 7); return { from: s.toISOString().slice(0, 10), to: e.toISOString().slice(0, 10), groupBy: 'day' } } },
    { label: '30j', getRange: () => { const e = new Date(); const s = new Date(e); s.setDate(s.getDate() - 30); return { from: s.toISOString().slice(0, 10), to: e.toISOString().slice(0, 10), groupBy: 'day' } } },
    { label: '3 mois', getRange: () => { const e = new Date(); const s = new Date(e); s.setMonth(s.getMonth() - 3); return { from: s.toISOString().slice(0, 10), to: e.toISOString().slice(0, 10), groupBy: 'month' } } },
    { label: 'Année', getRange: () => { const e = new Date(); return { from: `${e.getFullYear()}-01-01`, to: e.toISOString().slice(0, 10), groupBy: 'month' } } },
  ]

  return (
    <AdminLayout>
      <div className="min-w-0 w-full max-w-7xl mx-auto px-0 sm:px-2">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2C2C2C] font-heading tracking-tight">
            Statistiques
          </h1>
          <p className="text-sm sm:text-base text-[#6b7280] mt-1 sm:mt-2 max-w-2xl">
            Effectifs, secteurs d&apos;activité et évolution dans le temps.
          </p>
        </div>

        {/* Bandeau stats — aligné dashboard */}
        <div className="mb-6 sm:mb-8 rounded-xl sm:rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#F4F6F8] p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8F4F3" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#226D68" strokeWidth="3" strokeDasharray={`${validationRate}, 100`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-base sm:text-lg font-bold text-[#226D68] font-heading">
                  {validationRate}%
                </span>
              </div>
              <div>
                <p className="font-semibold text-[#2C2C2C] text-sm sm:text-base">Taux de validation</p>
                <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">{totalValidated} validés sur {totalInscrits} inscrits au total</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium ${totalInscrits > 0 ? 'bg-[#226D68]/10 text-[#226D68]' : 'bg-gray-100 text-[#6b7280]'}`}>
                <Users className="h-3.5 w-3.5 shrink-0" />
                {totalInscrits} inscrits
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium ${totalValidated > 0 ? 'bg-[#E8F4F3] text-[#226D68]' : 'bg-gray-100 text-[#6b7280]'}`}>
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                {totalValidated} validés
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium ${totalArchived > 0 ? 'bg-gray-100 text-[#6b7280]' : 'bg-gray-100 text-[#6b7280]'}`}>
                <Archive className="h-3.5 w-3.5 shrink-0" />
                {totalArchived} archivés
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E8F4F3]/80 text-[#226D68]">
                <PieChart className="h-3.5 w-3.5 shrink-0" />
                {sectorCount} secteurs
              </span>
              <Button onClick={loadStatsBySector} variant="outline" size="sm" disabled={loadingStatsBySector} className="h-8 w-8 sm:h-7 sm:w-auto sm:px-3 p-0 rounded-lg border-gray-200 text-[#226D68] hover:bg-[#226D68]/10 shrink-0">
                <RefreshCw className={`w-4 h-4 sm:mr-1 ${loadingStatsBySector ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Grille KPI — style cartes dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 mb-6 sm:mb-8">
          {[
            { icon: Users, label: 'Effectif total', value: totalInscrits, desc: 'Inscrits tous statuts confondus', accent: 'default' },
            { icon: CheckCircle, label: 'Validés', value: totalValidated, desc: 'Visibles dans la CVthèque', accent: 'green' },
            { icon: Archive, label: 'Archivés', value: totalArchived, desc: 'Profils archivés', accent: 'default' },
            { icon: TrendingUp, label: 'Taux de validation', value: `${validationRate}%`, desc: 'Validés / inscrits', accent: 'green' },
            { icon: PieChart, label: 'Secteurs', value: sectorCount, desc: 'Secteurs d\'activité représentés', accent: 'default' },
          ].map((item) => {
            const Icon = item.icon
            const accentBg = item.accent === 'green' ? 'bg-[#E8F4F3]' : 'bg-[#E8F4F3]/60'
            const accentColor = item.accent === 'green' ? 'text-[#226D68]' : 'text-[#226D68]'
            return (
              <div
                key={item.label}
                className="group text-left rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 hover:border-[#226D68]/40 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${accentBg}`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${accentColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#2C2C2C] text-sm mb-0.5">{item.label}</p>
                    <p className="text-xs text-[#6b7280]">{item.desc}</p>
                    <p className={`text-lg font-bold mt-2 ${(typeof item.value === 'number' ? item.value > 0 : true) ? 'text-[#226D68]' : 'text-[#6b7280]'}`}>
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabs — aligné dashboard */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 mb-6 w-full sm:w-fit shadow-sm overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', shortLabel: 'Vue', icon: BarChart3 },
            { id: 'sectors', label: 'Par secteur', shortLabel: 'Secteurs', icon: PieChart },
            { id: 'period', label: 'Par période', shortLabel: 'Période', icon: Calendar },
          ].map(({ id, label, shortLabel, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatsTab(id)}
              className={`flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-all shrink-0 ${statsTab === id ? 'bg-[#226D68] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#2C2C2C] hover:bg-gray-50'}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loadingStatsBySector && statsTab !== 'period' ? (
          <div className="flex gap-3 items-center justify-center py-20 text-[#6b7280]">
            <Loader2 className="w-6 h-6 animate-spin text-[#226D68]" />
            <span className="text-sm">Chargement des statistiques…</span>
          </div>
        ) : (
          <>
            {statsTab === 'overview' && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-[#2C2C2C] mb-3">Synthèse RH</h2>
                    <p className="text-sm text-[#6b7280] leading-relaxed">
                      {totalValidated} candidat{totalValidated !== 1 ? 's' : ''} validé{totalValidated !== 1 ? 's' : ''} sur {totalInscrits} inscrit{totalInscrits !== 1 ? 's' : ''} (taux de validation {validationRate}%).
                      {totalArchived > 0 && ` ${totalArchived} profil${totalArchived !== 1 ? 's' : ''} archivé${totalArchived !== 1 ? 's' : ''}.`}
                      {sectorCount === 0 ? ' Aucun secteur renseigné.' : ` ${sectorCount} secteur${sectorCount !== 1 ? 's' : ''} représenté${sectorCount !== 1 ? 's' : ''}.`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/validation')}
                    className="shrink-0 border-[#226D68]/30 text-[#226D68] hover:bg-[#226D68]/10 w-full sm:w-auto"
                  >
                    <ChevronRight className="w-4 h-4 mr-1" />
                    Valider des profils
                  </Button>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-xs text-[#6b7280]">
                    <strong>Par secteur</strong> : viviers et taux par secteur. <strong>Par période</strong> : inscriptions et décisions dans le temps.
                  </p>
                </div>
              </div>
            )}

            {statsTab === 'sectors' && (
              statsBySector.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 sm:p-12 md:p-16 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <PieChart className="w-7 h-7 sm:w-8 sm:h-8 text-[#6b7280]" />
                  </div>
                  <p className="text-base font-semibold text-[#2C2C2C]">Aucune donnée par secteur</p>
                  <p className="text-sm text-[#6b7280] mt-2 max-w-sm mx-auto">
                    Renseignez le secteur d&apos;activité dans les profils candidats.
                  </p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Tableau principal - card view sur mobile */}
                  <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-[#E8F4F3]/60 to-white">
                      <h3 className="text-sm font-semibold text-[#2C2C2C]">Répartition par secteur</h3>
                    </div>
                    {/* Mobile: cards */}
                    <div className="block sm:hidden divide-y divide-gray-100">
                      {sortedRows.map((row) => {
                        const total = row.total ?? 0
                        const validated = row.validated ?? 0
                        const archived = row.archived ?? 0
                        const rate = total > 0 ? Math.round((validated / total) * 100) : 0
                        return (
                          <div key={row.sector} className="p-4 hover:bg-[#E8F4F3]/20 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-[#2C2C2C] truncate pr-2">{row.sector || '—'}</span>
                              <span className="text-sm tabular-nums text-[#6b7280] shrink-0">{total} inscrits</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-[#1a5a55] font-medium">{validated} validés</span>
                              <span className="text-[#6b7280]">{archived} archivés</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <Progress value={rate} className="h-2 flex-1 bg-gray-100 [&>div]:bg-[#226D68]" />
                              <span className="text-xs text-[#6b7280] tabular-nums w-8">{rate}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Desktop: table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full min-w-[500px] text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50/80">
                            <th className="text-left py-3 px-3 sm:px-4 font-medium text-[#6b7280]">
                              <button type="button" onClick={() => toggleSort('sector')} className="flex items-center hover:text-[#226D68]">Secteur <SortIcon column="sector" /></button>
                            </th>
                            <th className="text-right py-3 px-3 sm:px-4 font-medium text-[#6b7280]">
                              <button type="button" onClick={() => toggleSort('total')} className="inline-flex items-center ml-auto hover:text-[#226D68]">Inscrits <SortIcon column="total" /></button>
                            </th>
                            <th className="text-right py-3 px-3 sm:px-4 font-medium text-[#6b7280]">
                              <button type="button" onClick={() => toggleSort('validated')} className="inline-flex items-center ml-auto hover:text-[#226D68]">Validés <SortIcon column="validated" /></button>
                            </th>
                            <th className="text-right py-3 px-3 sm:px-4 font-medium text-[#6b7280] hidden md:table-cell">
                              <button type="button" onClick={() => toggleSort('archived')} className="inline-flex items-center ml-auto hover:text-[#226D68]">Archivés <SortIcon column="archived" /></button>
                            </th>
                            <th className="text-right py-3 px-3 sm:px-4 font-medium text-[#6b7280] w-24 sm:w-28">
                              <button type="button" onClick={() => toggleSort('rate')} className="inline-flex items-center ml-auto hover:text-[#226D68]">Taux <SortIcon column="rate" /></button>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sortedRows.map((row) => {
                            const total = row.total ?? 0
                            const validated = row.validated ?? 0
                            const archived = row.archived ?? 0
                            const rate = total > 0 ? Math.round((validated / total) * 100) : 0
                            return (
                              <tr key={row.sector} className="hover:bg-[#E8F4F3]/30 transition-colors">
                                <td className="py-3 px-3 sm:px-4 font-medium text-[#2C2C2C]">{row.sector || '—'}</td>
                                <td className="py-3 px-3 sm:px-4 text-right tabular-nums">{total}</td>
                                <td className="py-3 px-3 sm:px-4 text-right tabular-nums text-[#1a5a55] font-medium">{validated}</td>
                                <td className="py-3 px-3 sm:px-4 text-right tabular-nums text-[#6b7280] hidden md:table-cell">{archived}</td>
                                <td className="py-3 px-3 sm:px-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="tabular-nums text-[#6b7280] text-xs">{rate}%</span>
                                    <Progress value={rate} className="h-2 w-12 sm:w-16 bg-gray-100 [&>div]:bg-[#226D68]" />
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Sidebar - top volume & taux */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                        <h3 className="text-sm font-semibold text-[#2C2C2C]">Volume (top 8)</h3>
                      </div>
                      <div className="p-4 space-y-3 max-h-[280px] overflow-y-auto">
                        {topByVolume.slice(0, 8).map((row) => {
                          const total = row.total ?? 0
                          const chartMax = Math.max(...topByVolume.map(r => r.total ?? 0), 1)
                          const pct = (total / chartMax) * 100
                          return (
                            <div key={row.sector} className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-[#2C2C2C] truncate flex-1 min-w-0">{row.sector || '—'}</span>
                              <span className="text-xs text-[#6b7280] tabular-nums shrink-0">{total}</span>
                              <div className="w-12 sm:w-16 h-2 rounded-full bg-gray-100 overflow-hidden shrink-0">
                                <div className="h-full rounded-full bg-[#226D68] transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {topByRate.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 bg-[#E8F4F3]/50">
                          <h3 className="text-sm font-semibold text-[#2C2C2C]">Meilleurs taux</h3>
                        </div>
                        <ul className="p-4 space-y-2">
                          {topByRate.map((row, i) => (
                            <li key={row.sector} className="flex items-center justify-between gap-2 text-sm min-w-0">
                              <span className="text-[#6b7280] w-5 shrink-0">{i + 1}.</span>
                              <span className="text-[#2C2C2C] truncate flex-1 min-w-0">{row.sector || '—'}</span>
                              <span className="font-semibold text-[#1a5a55] tabular-nums shrink-0">{row.rate}%</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {statsTab === 'period' && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-[#E8F4F3]/60 to-white">
                  <h3 className="text-sm font-semibold text-[#2C2C2C]">Évolution · Inscriptions, validations, rejets</h3>
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Filtres - responsive */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="date" value={periodFilter.from} onChange={(e) => setPeriodFilter((f) => ({ ...f, from: e.target.value || f.from }))} className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white flex-1 min-w-[120px]" />
                      <span className="text-[#6b7280] text-sm hidden sm:inline">→</span>
                      <input type="date" value={periodFilter.to} onChange={(e) => setPeriodFilter((f) => ({ ...f, to: e.target.value || f.to }))} className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white flex-1 min-w-[120px]" />
                    </div>
                    <select value={periodFilter.groupBy} onChange={(e) => setPeriodFilter((f) => ({ ...f, groupBy: e.target.value }))} className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white">
                      <option value="day">Jour</option>
                      <option value="month">Mois</option>
                      <option value="year">Année</option>
                    </select>
                    <div className="flex flex-wrap gap-2">
                      {periodPresets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => { const { from, to, groupBy } = preset.getRange(); setPeriodFilter({ from, to, groupBy }); loadStatsByPeriod({ from, to, groupBy }) }}
                          className="h-9 px-3 rounded-lg border border-gray-200 text-xs text-[#6b7280] hover:bg-[#226D68]/10 hover:text-[#226D68] hover:border-[#226D68]/30 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <Button size="sm" className="h-9 bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm shrink-0" onClick={() => loadStatsByPeriod()} disabled={loadingStatsByPeriod}>
                      {loadingStatsByPeriod ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                      Appliquer
                    </Button>
                  </div>
                  {loadingStatsByPeriod ? (
                    <div className="flex gap-3 items-center justify-center py-16 text-[#6b7280]">
                      <Loader2 className="w-6 h-6 animate-spin text-[#226D68]" />
                      <span className="text-sm">Chargement…</span>
                    </div>
                  ) : statsByPeriod.length === 0 ? (
                    <p className="text-sm text-[#6b7280] py-8 text-center">Aucune donnée pour cette période.</p>
                  ) : (
                    <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg border border-gray-200">
                      <table className="w-full min-w-[320px] text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50/80">
                            <th className="text-left py-3 px-3 sm:px-4 font-medium text-[#6b7280]">Période</th>
                            <th className="text-right py-3 px-3 sm:px-4 font-medium text-[#6b7280]">Inscr.</th>
                            <th className="text-right py-3 px-3 sm:px-4 font-medium text-[#6b7280]">Validés</th>
                            <th className="text-right py-3 px-3 sm:px-4 font-medium text-[#6b7280]">Rejetés</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {statsByPeriod.map((row) => (
                            <tr key={row.period} className="hover:bg-[#E8F4F3]/30 transition-colors">
                              <td className="py-3 px-3 sm:px-4 font-medium text-[#2C2C2C]">{row.period}</td>
                              <td className="py-3 px-3 sm:px-4 text-right tabular-nums">{row.inscriptions ?? 0}</td>
                              <td className="py-3 px-3 sm:px-4 text-right tabular-nums text-[#1a5a55] font-medium">{row.validated ?? 0}</td>
                              <td className="py-3 px-3 sm:px-4 text-right tabular-nums text-[#c04a2f] font-medium">{row.rejected ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
