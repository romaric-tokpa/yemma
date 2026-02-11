import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApiService } from '@/services/api'
import { formatDateTime } from '@/utils/dateUtils'
import AdminSidebar from '@/components/admin/AdminSidebar'
import {
  Shield, UserPlus, Copy, Mail, Loader2, AlertCircle,
  CheckCircle2, Search, RefreshCw, ChevronUp, ChevronDown, Filter
} from 'lucide-react'

const STATUS_CONFIG = {
  active: { label: 'Actif', className: 'bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/30' },
  used: { label: 'Utilisé', className: 'bg-muted text-muted-foreground border-border' },
  expired: { label: 'Expiré', className: 'bg-amber-50 text-amber-800 border-amber-200' },
}

export default function AdminInvitationsPage() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(true) // Page réservée SUPER_ADMIN

  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Génération
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('ROLE_ADMIN')
  const [expiresInHours, setExpiresInHours] = useState(72)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  const [generateSuccess, setGenerateSuccess] = useState(null)

  // Liste
  const [searchEmail, setSearchEmail] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [copiedId, setCopiedId] = useState(null)

  const getStatus = (inv) => {
    if (inv.is_used) return 'used'
    const expiresAt = inv.expires_at ? new Date(inv.expires_at) : null
    if (expiresAt && expiresAt < new Date()) return 'expired'
    return 'active'
  }

  const filtered = invitations.filter((inv) => {
    const status = getStatus(inv)
    if (filterStatus !== 'all' && status !== filterStatus) return false
    if (searchEmail.trim()) {
      const q = searchEmail.trim().toLowerCase()
      if (!inv.email?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'email') {
      cmp = (a.email || '').localeCompare(b.email || '')
    } else if (sortBy === 'status') {
      cmp = getStatus(a).localeCompare(getStatus(b))
    } else {
      const da = new Date(a.created_at || 0).getTime()
      const db = new Date(b.created_at || 0).getTime()
      cmp = da - db
    }
    return sortOrder === 'asc' ? cmp : -cmp
  })

  const stats = { active: 0, used: 0, expired: 0 }
  invitations.forEach((inv) => {
    const s = getStatus(inv)
    if (s in stats) stats[s]++
  })

  const loadInvitations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await authApiService.listAdminInvitations()
      setInvitations(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Erreur chargement invitations:', err)
      setError(err.response?.data?.detail || 'Erreur lors du chargement')
      setInvitations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      setIsSuperAdmin(Array.isArray(user?.roles) && user.roles.includes('ROLE_SUPER_ADMIN'))
    } catch {
      setIsSuperAdmin(false)
    }
  }, [])

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      authApiService.logout()
      navigate('/login')
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!email?.trim()) return
    try {
      setGenerateLoading(true)
      setGenerateError(null)
      setGenerateSuccess(null)
      const inv = await authApiService.generateAdminInvitation({
        email: email.trim(),
        role,
        expires_in_hours: Number(expiresInHours) || 72,
      })
      setInvitations((prev) => [inv, ...prev])
      setEmail('')
      navigator.clipboard?.writeText(inv.invitation_url).then(() => {
        setCopiedId(inv.id)
        setGenerateSuccess('Lien généré et copié dans le presse-papier')
        setTimeout(() => {
          setCopiedId(null)
          setGenerateSuccess(null)
        }, 3000)
      })
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Erreur lors de la génération'
      setGenerateError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setGenerateLoading(false)
    }
  }

  const copyUrl = (url, invId) => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedId(invId)
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(() => {})
  }

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ChevronUp className="w-3 h-3 opacity-30" />
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  return (
    <div className="h-screen bg-muted/30 flex overflow-hidden max-h-screen">
      <AdminSidebar
        mode="invitations"
        activeSection="admin-invitations"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSuperAdmin={isSuperAdmin}
        onLogout={handleLogout}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}

      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="container mx-auto px-3 sm:px-4 py-3 max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-gray-anthracite flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#226D68]" />
                Invitations administrateur
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Générez des liens sécurisés pour inviter de nouveaux administrateurs. Recherche, filtres et envoi par email.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadInvitations}
              disabled={loading}
              className="h-8 px-2.5 text-xs border-border text-gray-anthracite hover:bg-[#226D68]/10 hover:text-[#226D68] shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Mini stats */}
          <Card className="mb-3 border border-border overflow-hidden">
            <CardContent className="p-2.5 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#226D68]/15 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-[#226D68]" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                  <p className="text-sm font-bold text-[#1a5a55]">{invitations.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-[9px] px-1.5 py-0 h-4 bg-[#226D68]/15 text-[#1a5a55] border-0">
                  {stats.active} actives
                </Badge>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border">
                  {stats.used} utilisées
                </Badge>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-amber-200 text-amber-700 bg-amber-50">
                  {stats.expired} expirées
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
        <div className="space-y-4">
          {/* Carte : Générer une invitation */}
          <Card className="border border-border shadow-sm overflow-hidden">
            <CardHeader className="py-2.5 px-3 border-b border-border bg-[#226D68]/5">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-anthracite">
                <UserPlus className="w-4 h-4 text-[#226D68]" />
                Générer une invitation
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Créez un lien unique pour inviter un nouvel administrateur. Le destinataire pourra créer son compte sans être connecté.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3">
              <form onSubmit={handleGenerate} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-anthracite">Email</Label>
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-anthracite">Rôle</Label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                    >
                      <option value="ROLE_ADMIN">Administrateur</option>
                      <option value="ROLE_SUPER_ADMIN">Super Administrateur</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-anthracite">Validité (heures)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={720}
                      value={expiresInHours}
                      onChange={(e) => setExpiresInHours(Number(e.target.value) || 72)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <Button
                      type="submit"
                      disabled={generateLoading || !email?.trim()}
                      className="h-8 text-xs bg-[#226D68] hover:bg-[#1a5a55] text-white"
                    >
                      {generateLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Générer
                    </Button>
                  </div>
                </div>
                {generateError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p className="text-xs">{generateError}</p>
                  </div>
                )}
                {generateSuccess && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[#E8F4F3] border border-[#226D68]/30 text-[#1a5a55]">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p className="text-xs">{generateSuccess}</p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Carte : Liste des invitations */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-anthracite">
                    <Filter className="w-4 h-4 text-[#226D68]" />
                    Liste des invitations
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    {invitations.length} invitation(s) · {stats.active} actives · {stats.used} utilisées · {stats.expired} expirées
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par email..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="h-8 pl-8 pr-2 text-xs w-[200px]"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex h-8 rounded-md border border-input bg-background px-2.5 text-xs"
                  >
                    <option value="all">Toutes</option>
                    <option value="active">Actives</option>
                    <option value="used">Utilisées</option>
                    <option value="expired">Expirées</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#226D68]" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                  <p className="text-sm font-medium text-gray-anthracite">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadInvitations}
                    className="mt-3 h-8 text-xs"
                  >
                    Réessayer
                  </Button>
                </div>
              ) : sorted.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center rounded-lg border border-dashed border-border mx-4 mb-4 bg-muted/10">
                  <Shield className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                  <p className="text-sm font-medium text-gray-anthracite">
                    {invitations.length === 0 ? 'Aucune invitation générée' : 'Aucun résultat pour ces filtres'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {invitations.length === 0 ? 'Générez une invitation ci-dessus' : 'Modifiez les filtres ou la recherche'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-2.5 px-3 font-medium text-gray-anthracite">
                          <button
                            type="button"
                            onClick={() => toggleSort('email')}
                            className="flex items-center gap-1 hover:text-[#226D68]"
                          >
                            Email
                            <SortIcon field="email" />
                          </button>
                        </th>
                        <th className="text-left py-2.5 px-3 font-medium text-gray-anthracite">Rôle</th>
                        <th className="text-left py-2.5 px-3 font-medium text-gray-anthracite">
                          <button
                            type="button"
                            onClick={() => toggleSort('status')}
                            className="flex items-center gap-1 hover:text-[#226D68]"
                          >
                            Statut
                            <SortIcon field="status" />
                          </button>
                        </th>
                        <th className="text-left py-2.5 px-3 font-medium text-gray-anthracite">
                          <button
                            type="button"
                            onClick={() => toggleSort('created_at')}
                            className="flex items-center gap-1 hover:text-[#226D68]"
                          >
                            Créée
                            <SortIcon field="created_at" />
                          </button>
                        </th>
                        <th className="text-left py-2.5 px-3 font-medium text-gray-anthracite">Expire</th>
                        <th className="text-right py-2.5 px-3 font-medium text-gray-anthracite">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((inv) => {
                        const status = getStatus(inv)
                        const sc = STATUS_CONFIG[status] || STATUS_CONFIG.active
                        return (
                          <tr key={inv.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-gray-anthracite">{inv.email}</td>
                            <td className="py-2.5 px-3">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border">
                                {inv.role === 'ROLE_SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${sc.className}`}>
                                {sc.label}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground">{formatDateTime(inv.created_at)}</td>
                            <td className="py-2.5 px-3 text-muted-foreground">{formatDateTime(inv.expires_at)}</td>
                            <td className="py-2.5 px-3 text-right">
                              {status === 'active' && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyUrl(inv.invitation_url, inv.id)}
                                    className="h-7 px-2 text-xs hover:bg-[#226D68]/10 hover:text-[#226D68]"
                                  >
                                    {copiedId === inv.id ? (
                                      <>
                                        <CheckCircle2 className="h-3 w-3 mr-1 text-[#226D68]" />
                                        Copié
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copier
                                      </>
                                    )}
                                  </Button>
                                  <a
                                    href={`mailto:${inv.email}?subject=Invitation administrateur Yemma&body=Bonjour,%0D%0A%0D%0AVous êtes invité à créer votre compte administrateur Yemma.%0D%0A%0D%0ACliquez sur le lien suivant :%0D%0A${encodeURIComponent(inv.invitation_url)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center h-7 px-2 text-xs rounded-md text-muted-foreground hover:bg-[#226D68]/10 hover:text-[#226D68] transition-colors"
                                  >
                                    <Mail className="h-3 w-3 mr-1" />
                                    Envoyer
                                  </a>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
