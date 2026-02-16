/**
 * Page Validation : barre de recherche, filtres par statut, tableau des profils avec pagination.
 * Optimisée pour des milliers de profils : recherche côté serveur, vue tableau compacte, pagination avancée.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { candidateApi, documentApi } from '@/services/api'
import { buildPhotoUrl } from '@/utils/photoUtils'
import { formatDateTime } from '@/utils/dateUtils'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Users, Search, Loader2, Eye, User, AlertCircle, Briefcase, Calendar,
  Star, ChevronLeft, ChevronRight
} from 'lucide-react'

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  IN_REVIEW: 'En cours',
  VALIDATED: 'Validé',
  REJECTED: 'Rejeté',
  ARCHIVED: 'Archivé',
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-[#6b7280] border-gray-200',
  SUBMITTED: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  VALIDATED: 'bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/30',
  REJECTED: 'bg-[#e76f51]/15 text-[#c04a2f] border-[#e76f51]/30',
  ARCHIVED: 'bg-gray-100 text-[#6b7280] border-gray-200',
}

const PAGE_SIZES = [25, 50, 100, 200]

const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=226D68&color=fff&bold=true`
}

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debouncedValue
}

export default function AdminValidationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState(() => {
    const s = location.state?.status
    return ['ALL', 'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'VALIDATED', 'REJECTED', 'ARCHIVED'].includes(s) ? s : 'ALL'
  })
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)
  const [profilePhotos, setProfilePhotos] = useState({})
  const [profilesPage, setProfilesPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [profilesListTotal, setProfilesListTotal] = useState(null)
  const [stats, setStats] = useState({
    DRAFT: 0, SUBMITTED: 0, IN_REVIEW: 0, VALIDATED: 0, REJECTED: 0, ARCHIVED: 0,
  })

  const loadStats = async () => {
    try {
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
      } catch {
        // fallback
      }
      const statuses = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'VALIDATED', 'REJECTED', 'ARCHIVED']
      const statsPromises = statuses.map(async (status) => {
        try {
          const response = await candidateApi.listProfiles(status, 1, 10000)
          if (Array.isArray(response)) return { status, count: response.length }
          if (response?.items) return { status, count: response.total ?? response.items.length }
          return { status, count: 0 }
        } catch {
          return { status, count: 0 }
        }
      })
      const results = await Promise.all(statsPromises)
      const newStats = {}
      results.forEach(({ status, count }) => { newStats[status] = count })
      setStats(newStats)
    } catch (err) {
      console.error('Erreur stats:', err)
    }
  }

  const loadProfilePhotos = useCallback(async (profilesData) => {
    const photosMap = {}
    const needPhoto = profilesData.filter(p => !buildPhotoUrl(p.photo_url, documentApi))
    const promises = needPhoto.map(async (profile) => {
      try {
        const docs = await documentApi.getCandidateDocuments(profile.id)
        const photoDoc = docs
          ?.filter(doc => (doc.document_type === 'PROFILE_PHOTO' || doc.document_type === 'OTHER') && !doc.deleted_at)
          ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        if (photoDoc) photosMap[profile.id] = documentApi.getDocumentServeUrl(photoDoc.id)
      } catch {}
    })
    await Promise.all(promises)
    setProfilePhotos(prev => ({ ...prev, ...photosMap }))
  }, [])

  const loadProfiles = useCallback(async (status, page, size, search) => {
    try {
      setLoading(true)
      setError(null)
      const apiStatus = status === 'ALL' ? null : status
      const response = await candidateApi.listProfiles(apiStatus, page, size, search)
      let profilesData = []
      if (Array.isArray(response)) {
        profilesData = response
        setProfilesListTotal(null)
      } else if (response?.items) {
        profilesData = response.items
        setProfilesListTotal(typeof response.total === 'number' ? response.total : null)
      }
      profilesData.sort((a, b) => (b.submitted_at ? new Date(b.submitted_at).getTime() : 0) - (a.submitted_at ? new Date(a.submitted_at).getTime() : 0))
      setProfiles(profilesData)
      loadProfilePhotos(profilesData).catch(() => {})
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement des profils')
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }, [loadProfilePhotos])

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    const s = location.state?.status
    if (['ALL', 'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'VALIDATED', 'REJECTED', 'ARCHIVED'].includes(s)) {
      setSelectedStatus(s)
    }
  }, [location.state?.status])

  const prevFilterRef = useRef({ selectedStatus, debouncedSearch, pageSize })
  useEffect(() => {
    const filterChanged =
      prevFilterRef.current.selectedStatus !== selectedStatus ||
      prevFilterRef.current.debouncedSearch !== debouncedSearch ||
      prevFilterRef.current.pageSize !== pageSize
    if (filterChanged) {
      prevFilterRef.current = { selectedStatus, debouncedSearch, pageSize }
      setProfilesPage(1)
      loadProfiles(selectedStatus, 1, pageSize, debouncedSearch)
    } else {
      loadProfiles(selectedStatus, profilesPage, pageSize, debouncedSearch)
    }
  }, [selectedStatus, debouncedSearch, pageSize, profilesPage])

  const handleViewProfile = (profileId) => navigate(`/admin/review/${profileId}`)

  const totalForStatus = selectedStatus === 'ALL'
    ? (profilesListTotal != null ? profilesListTotal : Object.values(stats).reduce((a, b) => a + b, 0))
    : (profilesListTotal != null ? profilesListTotal : stats[selectedStatus]) ?? 0
  const totalPages = Math.max(1, Math.ceil(totalForStatus / pageSize))
  const startItem = totalForStatus === 0 ? 0 : (profilesPage - 1) * pageSize + 1
  const endItem = totalForStatus === 0 ? 0 : Math.min(profilesPage * pageSize, (profilesPage - 1) * pageSize + profiles.length)
  const hasNext = profilesPage < totalPages
  const hasPrev = profilesPage > 1

  const goToPage = (p) => {
    const page = Math.max(1, Math.min(totalPages, p))
    setProfilesPage(page)
  }

  const getDateLabel = (profile) => {
    if (profile.status === 'VALIDATED' && profile.validated_at) return { label: 'Validé', date: profile.validated_at, color: 'text-[#1a5a55]' }
    if (profile.status === 'REJECTED' && profile.rejected_at) return { label: 'Rejeté', date: profile.rejected_at, color: 'text-[#c04a2f]' }
    if (['SUBMITTED', 'IN_REVIEW'].includes(profile.status) && profile.submitted_at) return { label: 'Soumis', date: profile.submitted_at, color: 'text-amber-700' }
    if (profile.created_at) return { label: 'Inscrit', date: profile.created_at, color: 'text-muted-foreground' }
    return null
  }

  return (
    <AdminLayout>
      <div className="min-w-0 w-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2C2C2C] font-heading tracking-tight">Validation des candidats</h1>
        <p className="text-sm sm:text-base text-[#6b7280] mt-1 sm:mt-2 max-w-2xl">
          Recherchez, filtrez et validez les profils. Optimisé pour des milliers de candidats.
        </p>
      </div>

      {/* Barre sticky : recherche + filtres */}
      <div className="sticky top-0 sm:top-[57px] z-20 mb-4 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex-1 relative w-full min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280] shrink-0" />
            <Input
              placeholder="Rechercher (nom, email, titre…)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-10 text-sm bg-[#F4F6F8] border-gray-200 rounded-xl w-full"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'Tous' },
              { id: 'DRAFT', label: 'Brouillon' },
              { id: 'SUBMITTED', label: 'Soumis' },
              { id: 'IN_REVIEW', label: 'En cours' },
              { id: 'VALIDATED', label: 'Validé' },
              { id: 'REJECTED', label: 'Rejeté' },
              { id: 'ARCHIVED', label: 'Archivé' },
            ].map(({ id, label }) => (
              <Button
                key={id}
                variant={selectedStatus === id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(id)}
                className={`h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 rounded-xl shrink-0 ${selectedStatus === id ? 'bg-[#226D68] hover:bg-[#1a5a55]' : 'border-gray-200 text-[#2C2C2C] hover:bg-[#E8F4F3] hover:text-[#226D68] hover:border-[#226D68]/30'}`}
              >
                {label}
                {id === 'ALL' ? (
                  Object.values(stats).some(v => v > 0) && (
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-5 bg-white/80 text-[#2C2C2C]">
                      {Object.values(stats).reduce((a, b) => a + b, 0)}
                    </Badge>
                  )
                ) : stats[id] > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-5 bg-white/80 text-[#2C2C2C]">
                    {stats[id]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* En-tête tableau + pagination */}
        <div className="py-3 px-3 sm:py-4 sm:px-5 border-b border-gray-100 bg-gradient-to-r from-[#E8F4F3]/80 to-white flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#2C2C2C]">
              <Users className="w-4 h-4 text-[#226D68] shrink-0" />
              Profils · {selectedStatus === 'ALL' ? 'Tous les candidats' : STATUS_LABELS[selectedStatus]}
            </h3>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Par page</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setProfilesPage(1) }}
                  className="h-8 px-2 rounded-lg border border-gray-200 bg-white text-sm text-[#2C2C2C] min-w-0"
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {loading ? 'Chargement…' : totalForStatus === 0 ? '0 profil' : `${startItem}-${endItem} / ${totalForStatus.toLocaleString('fr-FR')}`}
              </span>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Button variant="outline" size="sm" disabled={!hasPrev || loading} onClick={() => goToPage(profilesPage - 1)} className="h-8 w-8 sm:h-7 sm:w-auto sm:px-2 p-0 text-xs border-border text-gray-anthracite hover:bg-[#226D68]/10 disabled:opacity-50">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-1 sm:px-2 min-w-[3rem] sm:min-w-[4rem] text-center">
                  {profilesPage}/{totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={!hasNext || loading} onClick={() => goToPage(profilesPage + 1)} className="h-8 w-8 sm:h-7 sm:w-auto sm:px-2 p-0 text-xs border-border text-gray-anthracite hover:bg-[#226D68]/10 disabled:opacity-50">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {totalPages > 3 && (
                  <div className="hidden md:flex items-center gap-1 ml-1">
                    <span className="text-[10px] text-muted-foreground">Aller à</span>
                    <Input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={profilesPage}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10)
                        if (!isNaN(v) && v >= 1) goToPage(v)
                      }}
                      className="h-7 w-14 text-xs text-center px-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#226D68]" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-[#e76f51] mb-2" />
              <p className="text-sm font-medium text-gray-anthracite mb-1">Erreur</p>
              <p className="text-xs text-muted-foreground mb-3 max-w-sm">{error}</p>
              <Button onClick={() => loadProfiles(selectedStatus, profilesPage, pageSize, debouncedSearch)} size="sm" className="h-8 bg-[#226D68] hover:bg-[#1a5a55]">Réessayer</Button>
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-[#F4F6F8] to-white mx-2 sm:mx-4 mb-4 p-4">
              <div className="w-16 h-16 rounded-2xl bg-[#E8F4F3] flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-[#226D68]" />
              </div>
              <p className="text-base font-semibold text-[#2C2C2C]">Aucun profil</p>
              <p className="text-sm text-[#6b7280] mt-1 max-w-sm">
                {debouncedSearch ? `Aucun candidat ne correspond à « ${debouncedSearch} ». Modifiez votre recherche.` : selectedStatus === 'ALL' ? 'Aucun candidat inscrit sur la plateforme.' : `Aucun profil en statut ${STATUS_LABELS[selectedStatus].toLowerCase()} pour le moment.`}
              </p>
            </div>
          ) : (
            <>
              {/* Vue cartes mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {profiles.map((profile) => {
                  const defaultAvatar = generateAvatarUrl(profile.first_name, profile.last_name)
                  let photoUrl = buildPhotoUrl(profile.photo_url, documentApi)
                  if (!photoUrl && profilePhotos[profile.id]) photoUrl = profilePhotos[profile.id]
                  const displayPhoto = photoUrl || defaultAvatar
                  const dateInfo = getDateLabel(profile)
                  const completion = profile.completion_percentage?.toFixed(0) ?? 0
                  return (
                    <div
                      key={profile.id}
                      onClick={() => handleViewProfile(profile.id)}
                      className="flex items-center gap-3 p-3 active:bg-[#E8F4F3]/50 cursor-pointer transition-colors"
                    >
                      <img src={displayPhoto} alt={`${profile.first_name} ${profile.last_name}`} className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 shrink-0" onError={(e) => { e.target.src = defaultAvatar }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[#2C2C2C] truncate">{profile.first_name} {profile.last_name}</div>
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 mt-1 font-medium ${STATUS_COLORS[profile.status] || STATUS_COLORS.DRAFT}`}>
                          {STATUS_LABELS[profile.status] || profile.status}
                        </Badge>
                        {profile.profile_title && <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5"><Briefcase className="h-3 w-3 shrink-0 text-[#226D68]" />{profile.profile_title}</div>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{completion}%</span>
                          {dateInfo && <span className={dateInfo.color}>{formatDateTime(dateInfo.date)}</span>}
                          {profile.admin_score != null && <span className="text-[#226D68] font-medium">★ {profile.admin_score}/5</span>}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleViewProfile(profile.id) }} className="h-9 w-9 p-0 shrink-0 text-[#226D68] hover:bg-[#226D68]/10">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
              {/* Vue tableau desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80">
                      <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider w-14">Photo</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Candidat</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider w-20">Statut</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Titre</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell">Email</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider w-20">Compl.</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider w-28">Date</th>
                      <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider w-20">Score</th>
                      <th className="text-right py-3 px-3 sm:px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {profiles.map((profile) => {
                      const defaultAvatar = generateAvatarUrl(profile.first_name, profile.last_name)
                      let photoUrl = buildPhotoUrl(profile.photo_url, documentApi)
                      if (!photoUrl && profilePhotos[profile.id]) photoUrl = profilePhotos[profile.id]
                      const displayPhoto = photoUrl || defaultAvatar
                      const dateInfo = getDateLabel(profile)
                      const completion = profile.completion_percentage?.toFixed(0) ?? 0
                      return (
                        <tr
                          key={profile.id}
                          onClick={() => handleViewProfile(profile.id)}
                          className="group hover:bg-[#E8F4F3]/50 cursor-pointer transition-colors"
                        >
                          <td className="py-2 px-3 sm:px-4">
                            <img src={displayPhoto} alt={`${profile.first_name} ${profile.last_name}`} className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 shadow-sm" onError={(e) => { e.target.src = defaultAvatar }} />
                          </td>
                          <td className="py-2 px-3 sm:px-4">
                            <div className="font-medium text-sm text-[#2C2C2C] group-hover:text-[#226D68] truncate max-w-[140px]">
                              {profile.first_name} {profile.last_name}
                            </div>
                          </td>
                          <td className="py-2 px-3 sm:px-4">
                            <Badge className={`text-[10px] px-2 py-0 h-5 font-medium ${STATUS_COLORS[profile.status] || STATUS_COLORS.DRAFT}`}>
                              {STATUS_LABELS[profile.status] || profile.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 sm:px-4">
                            <span className="text-xs text-muted-foreground truncate max-w-[140px] block">{profile.profile_title || '—'}</span>
                          </td>
                          <td className="py-2 px-3 sm:px-4 hidden lg:table-cell">
                            <span className="text-xs text-muted-foreground truncate max-w-[180px] block">{profile.email || '—'}</span>
                          </td>
                          <td className="py-2 px-3 sm:px-4">
                            <span className="text-xs font-medium text-[#2C2C2C]">{completion}%</span>
                          </td>
                          <td className="py-2 px-3 sm:px-4">
                            {dateInfo ? (
                              <span className={`text-xs flex items-center gap-1 ${dateInfo.color}`}>
                                <Calendar className="h-3 w-3 shrink-0" />
                                {formatDateTime(dateInfo.date)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 sm:px-4">
                            {profile.admin_score != null ? (
                              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#226D68]">
                                <Star className="h-3 w-3 fill-current" />
                                {profile.admin_score}/5
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 sm:px-4 text-right">
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleViewProfile(profile.id) }} className="h-8 px-2 text-[#226D68] hover:bg-[#226D68]/10">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </AdminLayout>
  )
}
