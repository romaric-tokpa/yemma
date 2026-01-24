import { useState, useEffect } from 'react'
import { UserPlus, Trash2, Mail, Users, CheckCircle2, Clock, Calendar, Shield, User } from 'lucide-react'
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
        <Loader2 className="h-6 w-6 animate-spin text-[#226D68] mr-2" />
        <span className="text-muted-foreground">Chargement des membres...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'invitation */}
      <Card className="rounded-[16px] shadow-sm border-l-4 border-l-[#226D68] bg-gradient-to-r from-white to-[#226D68]/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[#226D68]/20 to-[#226D68]/10 rounded-xl shadow-sm">
                <Users className="h-7 w-7 text-[#226D68]" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-anthracite font-heading mb-1">
                  Membres de l'équipe
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {teamMembers.length} {teamMembers.length === 1 ? 'membre' : 'membres'} {teamMembers.length > 0 && `• ${teamMembers.filter(m => m.type !== 'invitation' && m.status === 'active').length} actif${teamMembers.filter(m => m.type !== 'invitation' && m.status === 'active').length > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setInviteDialogOpen(true)}
              className="bg-gradient-to-r from-[#226D68] to-[#1a5a55] hover:from-[#1a5a55] hover:to-[#226D68] text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter un collaborateur
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Liste des membres ou message vide */}
      {teamMembers.length === 0 ? (
        <Card className="rounded-[16px] shadow-sm border-2 border-dashed border-gray-200 p-16 text-center bg-gradient-to-br from-gray-50 to-white">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#226D68]/20 to-blue-deep/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <UserPlus className="h-10 w-10 text-[#226D68]" />
            </div>
            <h3 className="text-xl font-bold text-gray-anthracite mb-2 font-heading">
              Aucun membre dans l'équipe
            </h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-md">
              Commencez par inviter des collaborateurs à rejoindre votre entreprise. 
              Ils recevront un email avec leurs identifiants de connexion.
            </p>
            <Button
              onClick={() => setInviteDialogOpen(true)}
              className="bg-gradient-to-r from-[#226D68] to-[#1a5a55] hover:from-[#1a5a55] hover:to-[#226D68] text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter votre premier collaborateur
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member, index) => (
            <Card 
              key={`${member.type}-${member.id}`}
              className="rounded-[16px] shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-[#226D68]/30 group overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex flex-col">
                  {/* Header avec avatar et actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Avatar amélioré */}
                      <div className="relative flex-shrink-0">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#226D68] via-[#1a5a55] to-blue-deep flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white">
                          {member.first_name 
                            ? member.first_name.charAt(0).toUpperCase()
                            : (member.user_email || member.email || 'M').charAt(0).toUpperCase()}
                        </div>
                        {/* Indicateur de statut */}
                        {member.type !== 'invitation' && member.status === 'active' && (
                          <div className="absolute bottom-0 right-0 h-5 w-5 bg-[#226D68] rounded-full border-2 border-white flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Nom et rôle */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-anthracite font-heading truncate mb-1 group-hover:text-[#226D68] transition-colors">
                          {member.first_name && member.last_name 
                            ? `${member.first_name} ${member.last_name}`
                            : member.email || member.user_email || 'Membre'}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Badge rôle avec icône */}
                          <Badge
                            variant={member.role_in_company === 'ADMIN_ENTREPRISE' ? 'default' : 'secondary'}
                            className={`text-xs font-medium px-2.5 py-1 ${
                              member.role_in_company === 'ADMIN_ENTREPRISE' 
                                ? 'bg-gradient-to-r from-[#226D68] to-[#1a5a55] text-white border-0 shadow-sm' 
                                : 'bg-blue-deep/10 text-blue-deep border-blue-deep/20'
                            }`}
                          >
                            {member.role_in_company === 'ADMIN_ENTREPRISE' ? (
                              <>
                                <Shield className="h-3 w-3 mr-1" />
                                Administrateur
                              </>
                            ) : (
                              <>
                                <User className="h-3 w-3 mr-1" />
                                Recruteur
                              </>
                            )}
                          </Badge>
                          
                          {/* Badge statut */}
                          {member.type === 'invitation' ? (
                            <Badge variant="outline" className="text-xs font-medium px-2.5 py-1 text-[#e76f51] border-[#e76f51]/30 bg-[#FDF2F0]/50">
                              <Clock className="h-3 w-3 mr-1" />
                              En attente
                            </Badge>
                          ) : member.status === 'active' ? (
                            <Badge variant="outline" className="text-xs font-medium px-2.5 py-1 text-[#226D68] border-[#226D68]/30 bg-[#E8F4F3]/50">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs font-medium px-2.5 py-1 text-[#e76f51] border-[#e76f51]/30 bg-[#FDF2F0]/50">
                              <Clock className="h-3 w-3 mr-1" />
                              En attente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Bouton de suppression */}
                    {member.type !== 'invitation' && member.role_in_company !== 'ADMIN_ENTREPRISE' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAccess(member.id)}
                        className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Supprimer le membre"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Informations détaillées */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    {/* Email */}
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 truncate">
                        {member.email || member.user_email}
                      </span>
                    </div>
                    
                    {/* Date */}
                    {member.type === 'invitation' ? (
                      <div className="flex items-start gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="text-gray-600">
                          <div className="font-medium">Invité le</div>
                          <div className="text-xs text-gray-500">
                            {new Date(member.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          {member.expires_at && (
                            <>
                              <div className="font-medium mt-1">Expire le</div>
                              <div className="text-xs text-[#e76f51]">
                                {new Date(member.expires_at).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : member.joined_at ? (
                      <div className="flex items-start gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="text-gray-600">
                          <div className="font-medium">Membre depuis</div>
                          <div className="text-xs text-gray-500">
                            {new Date(member.joined_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  
                  {/* Message pour les invitations en attente */}
                  {member.type === 'invitation' && (
                    <div className="mt-4 p-3 bg-[#FDF2F0]/50 border border-[#F8D3CA]/50 rounded-lg">
                      <p className="text-xs text-[#c04a2f] font-medium">
                        En attente de réponse de l'invité
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
