import { useState, useEffect } from 'react'
import { UserPlus, Trash2, Mail, Users, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { InviteMemberDialog } from './InviteMemberDialog'
import { companyApi } from '../../services/api'
import { Loader2 } from 'lucide-react'

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
      setLoading(true)
      const data = await companyApi.getTeamMembers(companyId)
      setTeamMembers(data || [])
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
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-green-emerald mr-2" />
        <span className="text-muted-foreground">Chargement des membres...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'invitation */}
      <Card className="rounded-[12px] shadow-sm border-l-4 border-l-green-emerald">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-emerald/10 rounded-lg">
                <Users className="h-6 w-6 text-green-emerald" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-anthracite font-heading">
                  Équipe
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Gérez les membres de votre équipe et leurs accès
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setInviteDialogOpen(true)}
              className="bg-green-emerald hover:bg-green-emerald/90 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter un collaborateur
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Liste des membres ou message vide */}
      {teamMembers.length === 0 ? (
        <Card className="rounded-[12px] shadow-sm p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-light rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-anthracite mb-2">
            Aucun membre dans l'équipe
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Commencez par inviter des collaborateurs à rejoindre votre entreprise
          </p>
          <Button
            variant="outline"
            className="border-blue-deep text-blue-deep hover:bg-blue-deep/10"
            onClick={() => setInviteDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter un collaborateur
          </Button>
        </Card>
      ) : (
        <Card className="rounded-[12px] shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {teamMembers.map((member, index) => (
                <div 
                  key={member.id} 
                  className="p-6 hover:bg-gray-light transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-emerald to-blue-deep flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {(member.user_email || member.email || 'M').charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Informations */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg text-gray-anthracite font-heading truncate">
                            {member.user_email || member.email || 'Membre'}
                          </h3>
                          
                          {/* Badge rôle */}
                          <Badge
                            variant={member.role_in_company === 'ADMIN_ENTREPRISE' ? 'default' : 'secondary'}
                            className={`text-xs ${
                              member.role_in_company === 'ADMIN_ENTREPRISE' 
                                ? 'bg-green-emerald text-white border-0' 
                                : 'bg-blue-deep/10 text-blue-deep border-blue-deep/20'
                            }`}
                          >
                            {member.role_in_company === 'ADMIN_ENTREPRISE' ? 'Admin' : 'Recruteur'}
                          </Badge>
                          
                          {/* Badge statut */}
                          {member.status === 'active' ? (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600 bg-green-50">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-600 bg-orange-50">
                              <Clock className="h-3 w-3 mr-1" />
                              En attente
                            </Badge>
                          )}
                        </div>
                        
                        {/* Date de jointure */}
                        {member.joined_at && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>
                              Rejoint le {new Date(member.joined_at).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Bouton de suppression */}
                    {member.role_in_company !== 'ADMIN_ENTREPRISE' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveAccess(member.id)}
                        className="ml-4 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogue d'invitation */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        companyId={companyId}
        onSuccess={handleInviteSuccess}
      />
    </div>
  )
}
