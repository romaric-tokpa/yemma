import { useState, useEffect } from 'react'
import { UserPlus, Trash2, Mail } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { InviteMemberDialog } from './InviteMemberDialog'
import { companyApi } from '../../services/api'

export function TeamTab({ companyId, onUpdate }) {
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  useEffect(() => {
    if (companyId) {
      loadTeamMembers()
    }
  }, [companyId])

  const loadTeamMembers = async () => {
    try {
      const data = await companyApi.getTeamMembers(companyId)
      setTeamMembers(data)
    } catch (error) {
      console.error('Error loading team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAccess = async (memberId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer l\'accès de ce collaborateur ?')) {
      return
    }

    try {
      await companyApi.removeTeamMember(companyId, memberId)
      await loadTeamMembers()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error removing team member:', error)
      alert('Erreur lors de la suppression de l\'accès')
    }
  }

  const handleInviteSuccess = () => {
    setInviteDialogOpen(false)
    loadTeamMembers()
    if (onUpdate) onUpdate()
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Équipe</h2>
          <p className="text-gray-600 mt-1">
            Gérez les membres de votre équipe et leurs accès
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Inviter un collaborateur
        </Button>
      </div>

      {teamMembers.length === 0 ? (
        <Card className="p-8 text-center">
          <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Aucun membre dans l'équipe</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setInviteDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter un collaborateur
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {teamMembers.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {(member.user_email || member.email || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {member.user_email || member.email || 'Membre'}
                        </h3>
                        <Badge
                          variant={member.role_in_company === 'ADMIN_ENTREPRISE' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {member.role_in_company === 'ADMIN_ENTREPRISE' ? 'Admin' : 'Recruteur'}
                        </Badge>
                        {member.status === 'active' ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                            En attente
                          </Badge>
                        )}
                      </div>
                      {member.joined_at && (
                        <p className="text-sm text-gray-500">
                          Rejoint le {new Date(member.joined_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  {member.role_in_company !== 'ADMIN_ENTREPRISE' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveAccess(member.id)}
                      className="ml-4"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer l'accès
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        companyId={companyId}
        onSuccess={handleInviteSuccess}
      />
    </div>
  )
}

