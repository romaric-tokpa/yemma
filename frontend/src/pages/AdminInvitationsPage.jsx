/**
 * Page Invitations admin : créer et gérer les invitations pour comptes administrateurs.
 * Réservée aux SUPER_ADMIN.
 */
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { authApiService } from '@/services/api'
import { formatDate } from '@/utils/dateUtils'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  UserPlus,
  Copy,
  Check,
  Mail,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [genEmail, setGenEmail] = useState('')
  const [genRole, setGenRole] = useState('ROLE_ADMIN')
  const [genExpiresIn, setGenExpiresIn] = useState(72)

  const loadInvitations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await authApiService.listAdminInvitations()
      setInvitations(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Erreur chargement invitations:', err)
      const status = err.response?.status
      const detail = err.response?.data?.detail
      if (status === 403) {
        setError('Accès refusé. Cette page est réservée aux SUPER_ADMIN.')
      } else {
        setError(typeof detail === 'string' ? detail : err.message || 'Erreur lors du chargement.')
      }
      setInvitations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  const handleCopy = async (inv) => {
    const url = inv.invitation_url || `${window.location.origin}/admin/create-account?token=${inv.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(inv.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (e) {
      console.warn('Copy failed:', e)
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!genEmail?.trim()) return
    try {
      setGenerating(true)
      setError(null)
      await authApiService.generateAdminInvitation({
        email: genEmail.trim(),
        role: genRole,
        expires_in_hours: genExpiresIn,
      })
      setGenEmail('')
      await loadInvitations()
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : err.message || 'Erreur lors de la création.')
    } finally {
      setGenerating(false)
    }
  }

  const isExpired = (expiresAt) => expiresAt && new Date(expiresAt) < new Date()

  return (
    <AdminLayout>
      <div className="min-w-0 w-full">
        {/* Hero */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2C2C2C] font-heading tracking-tight">
            Invitations administrateurs
          </h1>
          <p className="text-sm sm:text-base text-[#6b7280] mt-1 sm:mt-2 max-w-2xl">
            Créez des liens d&apos;invitation pour ajouter des administrateurs ou super-administrateurs.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-6">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Formulaire création */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#F4F6F8] p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#226D68]/15 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-[#226D68]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#2C2C2C]">Créer une invitation</h2>
              <p className="text-sm text-[#6b7280]">Lien pour créer un compte admin ou super-admin</p>
            </div>
          </div>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <Label htmlFor="genEmail" className="text-sm font-medium text-[#2C2C2C]">Email invité</Label>
              <Input
                id="genEmail"
                type="email"
                placeholder="admin@example.com"
                value={genEmail}
                onChange={(e) => setGenEmail(e.target.value)}
                disabled={generating}
                className="mt-1.5 h-10 rounded-lg border-gray-200"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-[#2C2C2C]">Rôle</Label>
                <select
                  value={genRole}
                  onChange={(e) => setGenRole(e.target.value)}
                  disabled={generating}
                  className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="ROLE_ADMIN">Admin</option>
                  <option value="ROLE_SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-[#2C2C2C]">Validité (heures)</Label>
                <Input
                  type="number"
                  min={1}
                  max={720}
                  value={genExpiresIn}
                  onChange={(e) => setGenExpiresIn(parseInt(e.target.value, 10) || 72)}
                  disabled={generating}
                  className="mt-1.5 h-10 rounded-lg border-gray-200"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={generating || !genEmail?.trim()}
              className="bg-[#226D68] hover:bg-[#1a5a55] h-10 px-6 rounded-lg"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Générer l&apos;invitation
            </Button>
          </form>
        </div>

        {/* Liste invitations */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-[#F4F6F8]/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
                <Mail className="h-5 w-5 text-[#226D68]" />
                Invitations
              </h2>
              <p className="text-sm text-[#6b7280] mt-0.5">
                Cliquez sur « Copier » pour partager le lien d&apos;invitation
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadInvitations}
              disabled={loading}
              className="h-8 px-3 rounded-lg border-gray-200 text-[#226D68] hover:bg-[#226D68]/10 shrink-0"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[#226D68]" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center rounded-xl border-2 border-dashed border-gray-200 bg-[#F4F6F8]">
                <Mail className="h-12 w-12 text-gray-400 mb-4" />
                <p className="font-medium text-[#2C2C2C]">Aucune invitation</p>
                <p className="text-sm text-[#6b7280] mt-1">Créez une invitation ci-dessus pour commencer.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((inv) => {
                  const used = inv.is_used
                  const expired = isExpired(inv.expires_at)
                  const canCopy = !used && !expired
                  const statusLabel = used ? 'Utilisé' : expired ? 'Expiré' : 'En attente'
                  const statusClass = used
                    ? 'bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/30'
                    : expired
                      ? 'bg-gray-100 text-[#6b7280] border-gray-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  return (
                    <div
                      key={inv.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#226D68]/30 hover:bg-[#F4F6F8]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-[#E8F4F3] flex items-center justify-center shrink-0">
                          <Mail className="h-5 w-5 text-[#226D68]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#2C2C2C] truncate">{inv.email}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs px-2 py-0 h-5 font-medium ${statusClass}`}>
                              {statusLabel}
                            </Badge>
                            <span className="text-xs text-[#6b7280]">
                              {inv.role === 'ROLE_SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                              {!used && !expired && inv.expires_at && ` • Expire le ${formatDate(inv.expires_at)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 rounded-lg border-[#226D68]/30 text-[#226D68] hover:bg-[#226D68]/10 shrink-0 disabled:opacity-50"
                        onClick={() => handleCopy(inv)}
                        disabled={!canCopy}
                      >
                        {copiedId === inv.id ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copié
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copier le lien
                          </>
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
