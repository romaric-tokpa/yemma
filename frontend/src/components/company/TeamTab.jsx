import { useState, useEffect } from 'react'
import { UserPlus, Trash2, Mail, Users, CheckCircle2, Clock, Shield, User } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { InviteMemberDialog } from './InviteMemberDialog'
import { companyApi } from '../../services/api'
import { Loader2 } from 'lucide-react'

export function TeamTab({ companyId, onUpdate }) {
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  useEffect(() => {
    if (companyId) loadTeamMembers()
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
    if (!confirm('Supprimer l\'accès de ce collaborateur ?')) return
    try {
      await companyApi.removeTeamMember(companyId, memberId)
      await loadTeamMembers()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error removing team member:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleInviteSuccess = () => {
    setInviteDialogOpen(false)
    loadTeamMembers()
    if (onUpdate) onUpdate()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#226D68] mr-2" />
        <span className="text-xs text-[#9ca3af]">Chargement...</span>
      </div>
    )
  }

  const activeCount = teamMembers.filter(m => m.type !== 'invitation' && m.status === 'active').length

  return (
    <div className="space-y-4">
      {/* Header compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#9ca3af]">
            {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
            {teamMembers.length > 0 && ` • ${activeCount} actif${activeCount > 1 ? 's' : ''}`}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => setInviteDialogOpen(true)}
          className="h-8 text-xs bg-[#226D68] hover:bg-[#1a5a55]"
        >
          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
          Inviter
        </Button>
      </div>

      {teamMembers.length === 0 ? (
        <Card className="border border-dashed border-[#e5e7eb] bg-[#F4F6F8]/50">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-[#E8F4F3] flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-[#226D68]" />
            </div>
            <p className="text-sm font-medium text-[#2C2C2C] mb-1">Aucun membre</p>
            <p className="text-xs text-[#9ca3af] mb-4">Invitez des recruteurs pour collaborer</p>
            <Button
              size="sm"
              onClick={() => setInviteDialogOpen(true)}
              className="h-8 text-xs bg-[#226D68] hover:bg-[#1a5a55]"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Inviter un collaborateur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#e5e7eb] shadow-none overflow-hidden">
          <div className="divide-y divide-[#e5e7eb]">
            {teamMembers.map((member) => (
              <div
                key={`${member.type}-${member.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#F4F6F8]/50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#E8F4F3] flex items-center justify-center text-[#226D68] font-semibold text-sm flex-shrink-0">
                  {member.first_name
                    ? member.first_name.charAt(0).toUpperCase()
                    : (member.user_email || member.email || 'M').charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#2C2C2C] truncate">
                      {member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name}`
                        : member.email || member.user_email || 'Membre'}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 px-1.5 ${
                        member.role_in_company === 'ADMIN_ENTREPRISE'
                          ? 'bg-[#226D68]/10 text-[#226D68] border-[#226D68]/30'
                          : 'bg-[#F4F6F8] text-[#9ca3af] border-[#e5e7eb]'
                      }`}
                    >
                      {member.role_in_company === 'ADMIN_ENTREPRISE' ? (
                        <>
                          <Shield className="w-2.5 h-2.5 mr-0.5" />
                          Admin
                        </>
                      ) : (
                        <>
                          <User className="w-2.5 h-2.5 mr-0.5" />
                          Recruteur
                        </>
                      )}
                    </Badge>
                    {member.type === 'invitation' ? (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-[#e76f51] border-[#e76f51]/30 bg-[#FDF2F0]/50">
                        <Clock className="w-2.5 h-2.5 mr-0.5" />
                        En attente
                      </Badge>
                    ) : member.status === 'active' ? (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-[#226D68] border-[#226D68]/30 bg-[#E8F4F3]/50">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                        Actif
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-[#9ca3af] truncate mt-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    {member.email || member.user_email}
                  </p>
                </div>

                {member.type !== 'invitation' && member.role_in_company !== 'ADMIN_ENTREPRISE' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAccess(member.id)}
                    className="h-8 w-8 p-0 text-[#9ca3af] hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer l'accès"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
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
