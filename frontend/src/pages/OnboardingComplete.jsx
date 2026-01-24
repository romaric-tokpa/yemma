import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ArrowRight, Home, Eye, Edit } from 'lucide-react'
import { candidateApi } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function OnboardingComplete() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await candidateApi.getMyProfile()
        setProfile(profileData)
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProfile()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-light to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#226D68' }}></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
      SUBMITTED: { label: 'Soumis', className: 'bg-blue-100 text-blue-800' },
      IN_REVIEW: { label: 'En validation', className: 'bg-yellow-100 text-yellow-800' },
      VALIDATED: { label: 'Validé', className: 'text-white', bgColor: '#226D68' },
      REJECTED: { label: 'Refusé', className: 'bg-red-100 text-red-800' },
    }
    
    const config = statusConfig[status] || statusConfig.DRAFT
    
    return (
      <Badge 
        className={`${config.className} border-0`}
        style={config.bgColor ? { backgroundColor: config.bgColor } : {}}
      >
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-light to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl rounded-[16px] shadow-lg border-0 overflow-hidden">
        {/* Header avec gradient */}
        <div className="p-8 text-white text-center" style={{ background: `linear-gradient(to right, #226D68, #1a5a55)` }}>
          <div className="w-24 h-24 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold font-heading mb-3">Profil soumis avec succès !</h1>
          <p className="text-white/90 text-lg">
            Votre profil a été soumis pour validation par notre équipe.
          </p>
        </div>

        <div className="p-8">
          {/* Prochaines étapes */}
          <div className="rounded-[12px] p-6 mb-6 border border-blue-deep/10" style={{ background: `linear-gradient(135deg, rgba(11, 60, 93, 0.05) 0%, rgba(34, 109, 104, 0.05) 100%)` }}>
            <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <ArrowRight className="w-5 h-5" style={{ color: '#226D68' }} />
              Prochaines étapes
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5" style={{ backgroundColor: '#226D68' }}>
                  1
                </div>
                <span className="text-gray-700">Notre équipe va examiner votre profil dans les prochains jours.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5" style={{ backgroundColor: '#226D68' }}>
                  2
                </div>
                <span className="text-gray-700">Vous recevrez une notification par email une fois la validation effectuée.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5" style={{ backgroundColor: '#226D68' }}>
                  3
                </div>
                <span className="text-gray-700">Une fois validé, votre profil sera visible par les recruteurs.</span>
              </li>
            </ul>
          </div>

          {/* Informations du profil */}
          {profile && (
            <div className="bg-gray-50 rounded-[12px] p-6 mb-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Informations de votre profil</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Statut</span>
                  {getStatusBadge(profile.status)}
                </div>
                {profile.completion_percentage && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Complétion</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {Math.round(profile.completion_percentage)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/candidate/dashboard')}
              className="flex-1 text-white h-12"
              style={{ backgroundColor: '#226D68' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#226D68' }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir mon profil
            </Button>
            <Button
              onClick={() => navigate('/onboarding')}
              variant="outline"
              className="flex-1 border-blue-deep text-blue-deep hover:bg-blue-deep/10 h-12"
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier mon profil
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="flex-1 h-12"
            >
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
