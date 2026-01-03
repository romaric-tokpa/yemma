import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { candidateApi } from '@/services/api'

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card rounded-lg border shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Profil soumis avec succès !</h1>
          <p className="text-muted-foreground">
            Votre profil a été soumis pour validation par notre équipe.
          </p>
        </div>

        <div className="bg-muted rounded-lg p-6 mb-6 text-left">
          <h2 className="font-semibold mb-4">Prochaines étapes :</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Notre équipe va examiner votre profil dans les prochains jours.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>Vous recevrez une notification par email une fois la validation effectuée.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Une fois validé, votre profil sera visible par les recruteurs.</span>
            </li>
          </ul>
        </div>

        {profile && (
          <div className="bg-muted rounded-lg p-4 mb-6 text-sm">
            <p className="text-muted-foreground mb-2">
              <strong>Statut du profil :</strong> {profile.status}
            </p>
            {profile.completion_percentage && (
              <p className="text-muted-foreground">
                <strong>Complétion :</strong> {Math.round(profile.completion_percentage)}%
              </p>
            )}
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
          </button>
          <button
            onClick={() => navigate('/candidate/dashboard')}
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            Voir mon profil
          </button>
          <button
            onClick={() => navigate('/onboarding')}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Modifier mon profil
          </button>
        </div>
      </div>
    </div>
  )
}

