import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApiService } from '@/services/api'
import { formatDateTime } from '@/utils/dateUtils'
import {
  UserPlus,
  Copy,
  Check,
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Shield,
} from 'lucide-react'

export default function AdminInvitationsPage() {
  const navigate = useNavigate()
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
    <div className="min-h-screen bg-[#F4F6F8]">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#226D68]" />
            <h1 className="text-xl font-bold text-[#2C2C2C]">Invitations administrateurs</h1>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <Card className="mb-6 border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#226D68]" />
              Créer une invitation
            </CardTitle>
            <CardDescription className="text-sm">
              Envoyez un lien d&apos;invitation pour créer un compte admin (ADMIN ou SUPER_ADMIN).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <Label htmlFor="genEmail">Email invité</Label>
                <Input
                  id="genEmail"
                  type="email"
                  placeholder="admin@example.com"
                  value={genEmail}
                  onChange={(e) => setGenEmail(e.target.value)}
                  disabled={generating}
                  className="mt-1 h-9"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Rôle</Label>
                  <select
                    value={genRole}
                    onChange={(e) => setGenRole(e.target.value)}
                    disabled={generating}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="ROLE_ADMIN">Admin</option>
                    <option value="ROLE_SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <Label>Validité (heures)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={720}
                    value={genExpiresIn}
                    onChange={(e) => setGenExpiresIn(parseInt(e.target.value, 10) || 72)}
                    disabled={generating}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={generating || !genEmail?.trim()}
                className="bg-[#226D68] hover:bg-[#1a5a55]"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Générer l&apos;invitation
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Invitations</CardTitle>
            <CardDescription className="text-sm">
              Liste des invitations créées. Cliquez pour copier le lien.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#226D68]" />
              </div>
            ) : invitations.length === 0 ? (
              <p className="text-sm text-[#6b7280] text-center py-8">Aucune invitation.</p>
            ) : (
              <div className="space-y-3">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-gray-200 bg-white"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="h-4 w-4 text-[#6b7280] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#2C2C2C] truncate">{inv.email}</p>
                        <p className="text-xs text-[#6b7280]">
                          {inv.role} • {inv.is_used ? 'Utilisé' : isExpired(inv.expires_at) ? 'Expiré' : `Expire le ${formatDateTime(inv.expires_at)}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-8 border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3]"
                      onClick={() => handleCopy(inv)}
                      disabled={inv.is_used || isExpired(inv.expires_at)}
                    >
                      {copiedId === inv.id ? (
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {copiedId === inv.id ? 'Copié' : 'Copier le lien'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
