import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { authApiService } from '@/services/api'
import { ROUTES } from '@/constants/routes'
import { candidateApi } from '@/services/api'
import { Loader2, AlertCircle } from 'lucide-react'

/**
 * Page de callback OAuth : reçoit les tokens depuis l'URL,
 * les stocke et redirige vers l'onboarding ou le dashboard.
 */
export default function RegisterCandidatOAuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState(null)

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')

    if (accessToken) {
      localStorage.setItem('auth_token', accessToken)
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken)

      const loadUserAndRedirect = async () => {
        try {
          const user = await authApiService.getCurrentUser()
          localStorage.setItem('user', JSON.stringify(user))
          const roles = user.roles || []

          if (roles.includes('ROLE_CANDIDAT')) {
            try {
              const profile = await candidateApi.getMyProfile()
              const isOnboardingComplete =
                profile.status !== 'DRAFT' ||
                (profile.last_step_completed != null && profile.last_step_completed >= 7)
              navigate(isOnboardingComplete ? ROUTES.CANDIDATE_DASHBOARD : ROUTES.ONBOARDING, { replace: true })
            } catch {
              navigate(ROUTES.ONBOARDING, { replace: true })
            }
          } else {
            navigate(ROUTES.ONBOARDING, { replace: true })
          }
        } catch (err) {
          console.error('OAuth callback error:', err)
          setError('Impossible de charger votre profil. Veuillez réessayer.')
        }
      }

      loadUserAndRedirect()
    } else {
      const oauthError = searchParams.get('oauth_error')
      if (oauthError === 'email_exists' || oauthError === 'exists_password') {
        setError('Un compte avec cet email existe déjà. Connectez-vous avec votre mot de passe.')
      } else if (oauthError === 'cancelled') {
        navigate('/register/candidat', { replace: true })
      } else {
        setError('Une erreur est survenue lors de la connexion. Veuillez réessayer.')
      }
    }
  }, [navigate, searchParams])

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
        <Card className="w-full max-w-[380px] rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/register/candidat', { replace: true })}
              className="mt-4 w-full py-2 text-sm font-medium text-[#226D68] hover:underline"
            >
              Retour à l&apos;inscription
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <Card className="w-full max-w-[380px] rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#226D68] animate-spin" />
          <p className="text-sm text-[#6b7280]">Connexion en cours...</p>
        </CardContent>
      </Card>
    </div>
  )
}
