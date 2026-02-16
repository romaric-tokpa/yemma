import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { authApiService } from '@/services/api'
import { ROUTES } from '@/constants/routes'
import { candidateApi } from '@/services/api'
import { Loader2, AlertCircle } from 'lucide-react'

/**
 * Extrait les tokens depuis l'URL (query params ou hash fragment).
 * Certains providers OAuth utilisent #access_token=... au lieu de ?access_token=...
 */
function getTokensFromUrl() {
  // 1. Paramètres de requête (?access_token=...&refresh_token=...)
  const params = new URLSearchParams(window.location.search)
  let accessToken = params.get('access_token')
  let refreshToken = params.get('refresh_token')

  // 2. Fallback : fragment hash (#access_token=...&refresh_token=...)
  if (!accessToken && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    accessToken = hashParams.get('access_token')
    refreshToken = hashParams.get('refresh_token')
  }

  return { accessToken, refreshToken }
}

/**
 * Page de callback OAuth : reçoit les tokens depuis l'URL,
 * les stocke et redirige vers l'onboarding ou le dashboard.
 */
export default function RegisterCandidatOAuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState(null)
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const { accessToken, refreshToken } = getTokensFromUrl()

    if (accessToken) {
      // Sauvegarder les tokens (clé auth_token utilisée par l'API)
      localStorage.setItem('auth_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }

      // Nettoyer l'URL des tokens (sécurité : éviter fuite via referrer)
      window.history.replaceState({}, document.title, window.location.pathname)

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
      } else if (oauthError) {
        setError('Une erreur est survenue lors de la connexion. Veuillez réessayer.')
      } else {
        setError('Aucun token reçu. Veuillez réessayer la connexion.')
      }
    }
  }, [navigate, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-[380px] rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#226D68] animate-spin" />
          <p className="text-sm text-[#6b7280]">Connexion en cours...</p>
        </CardContent>
      </Card>
    </div>
  )
}
