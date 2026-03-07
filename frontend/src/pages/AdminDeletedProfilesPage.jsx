/**
 * Page admin : liste des profils candidats supprimés (trace d'audit).
 * Route : /yemma/deleted-profiles
 */
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminApi } from '@/services/api'
import { formatDateTime } from '@/utils/dateUtils'
import AdminLayout from '@/components/admin/AdminLayout'
import { ROUTES } from '@/constants/routes'
import { Trash2, RefreshCw, Loader2, UserX, Mail, Calendar } from 'lucide-react'

export default function AdminDeletedProfilesPage() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const limit = 50

  const loadDeletedProfiles = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getDeletedProfiles(limit, offset)
      setItems(data?.items || [])
      setTotal(data?.total ?? 0)
    } catch (err) {
      console.error('Erreur chargement profils supprimés:', err)
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeletedProfiles()
  }, [offset])

  const fullName = (item) => {
    const parts = [item.first_name, item.last_name].filter(Boolean)
    return parts.length ? parts.join(' ') : '—'
  }

  return (
    <AdminLayout>
      <div className="min-w-0 w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2C2C2C] font-heading tracking-tight">
            Profils supprimés
          </h1>
          <p className="text-sm sm:text-base text-[#6b7280] mt-1 sm:mt-2 max-w-2xl">
            Historique des profils candidats supprimés par eux-mêmes. Ces données sont conservées à des fins d&apos;audit.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <UserX className="h-4 w-4 text-[#226D68]" />
                Trace des suppressions
              </CardTitle>
              <CardDescription>
                {total} enregistrement{total !== 1 ? 's' : ''} au total
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDeletedProfiles}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Actualiser</span>
            </Button>
          </CardHeader>
          <CardContent>
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#226D68]" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-[#6b7280]">
                <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun profil supprimé enregistré.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-[#2C2C2C]">Profil</th>
                      <th className="text-left py-3 px-2 font-medium text-[#2C2C2C]">Email</th>
                      <th className="text-left py-3 px-2 font-medium text-[#2C2C2C]">Date suppression</th>
                      <th className="text-left py-3 px-2 font-medium text-[#2C2C2C]">Raison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 px-2">
                          <span className="font-medium text-[#2C2C2C]">{fullName(item)}</span>
                          <span className="text-[#6b7280] ml-1">(ID: {item.profile_id})</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center gap-1 text-[#6b7280]">
                            <Mail className="h-3.5 w-3.5" />
                            {item.email || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center gap-1 text-[#6b7280]">
                            <Calendar className="h-3.5 w-3.5" />
                            {item.deleted_at ? formatDateTime(item.deleted_at) : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[#e76f51]/10 text-[#c04a2f]">
                            {item.deletion_reason === 'SELF_DELETED' ? 'Auto-suppression' : item.deletion_reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {total > limit && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-[#6b7280]">
                  Affichage {offset + 1}–{Math.min(offset + limit, total)} sur {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset === 0}
                    onClick={() => setOffset((o) => Math.max(0, o - limit))}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset + limit >= total}
                    onClick={() => setOffset((o) => o + limit)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
