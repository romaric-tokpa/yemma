import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { ROUTES, getDefaultRouteForRole } from '@/constants/routes'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApiService, candidateApi, companyApi } from '@/services/api'
import { loginSchema } from '@/schemas/auth'
import { LogIn, AlertCircle, User, Building } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Récupérer l'URL de redirection depuis l'état de navigation
  const from = location.state?.from || null

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const { register, handleSubmit, formState: { errors } } = form

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await authApiService.login(data.email, data.password)
      
      // Récupérer les informations de l'utilisateur
      const user = await authApiService.getCurrentUser()
      localStorage.setItem('user', JSON.stringify(user))

      // Rediriger selon le rôle
      const roles = user.roles || []
      if (roles.includes('ROLE_CANDIDAT')) {
        // Vérifier si le profil existe et si l'onboarding est complété
        try {
          const profile = await candidateApi.getMyProfile()
          // Si le profil existe, vérifier si l'onboarding est complété
          // L'onboarding est considéré comme complété si :
          // - Le profil a été soumis (status !== 'DRAFT')
          // - OU le last_step_completed est >= 7 (étape 7 = préférences, dernière étape avant récapitulatif)
          const isOnboardingComplete = profile.status !== 'DRAFT' || 
                                       (profile.last_step_completed !== null && profile.last_step_completed >= 7)
          
          if (isOnboardingComplete) {
            // L'onboarding est complété, rediriger vers le dashboard ou l'URL demandée
            navigate(from || ROUTES.CANDIDATE_DASHBOARD, { replace: true })
          } else {
            // L'onboarding n'est pas complété, rediriger vers l'onboarding
            navigate(ROUTES.ONBOARDING, { replace: true })
          }
        } catch (profileError) {
          // Si le profil n'existe pas (404), rediriger vers l'onboarding
          if (profileError.response?.status === 404) {
            navigate(ROUTES.ONBOARDING, { replace: true })
          } else {
            console.error('Erreur lors de la récupération du profil:', profileError)
            // En cas d'erreur, rediriger vers l'onboarding par sécurité
            navigate(ROUTES.ONBOARDING, { replace: true })
          }
        }
      } else if (roles.includes('ROLE_COMPANY_ADMIN')) {
        // Vérifier si l'entreprise existe
        try {
          await companyApi.getMyCompany()
          // L'entreprise existe, rediriger vers le dashboard ou l'URL demandée
          navigate(from || ROUTES.COMPANY_DASHBOARD, { replace: true })
        } catch (companyError) {
          // Si l'entreprise n'existe pas (404), rediriger vers l'onboarding
          if (companyError.response?.status === 404) {
            navigate(ROUTES.COMPANY_ONBOARDING, { replace: true })
          } else {
            console.error('Erreur lors de la récupération de l\'entreprise:', companyError)
            // En cas d'erreur, rediriger vers l'onboarding par sécurité
            navigate(ROUTES.COMPANY_ONBOARDING, { replace: true })
          }
        }
      } else if (roles.includes('ROLE_RECRUITER')) {
        // Les recruteurs ont accès uniquement à la recherche de candidats
        // Vérifier si l'entreprise existe (pour s'assurer que le TeamMember est bien créé)
        try {
          await companyApi.getMyCompany()
          // L'entreprise existe, rediriger directement vers la recherche ou l'URL demandée
          navigate(from || ROUTES.COMPANY_DASHBOARD, { replace: true })
        } catch (companyError) {
          // Si l'entreprise n'existe pas, il y a un problème
          console.error('Erreur: Le recruteur n\'est pas associé à une entreprise:', companyError)
          setError('Votre compte n\'est pas encore associé à une entreprise. Contactez votre administrateur.')
        }
      } else if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN')) {
        navigate(from || ROUTES.ADMIN_DASHBOARD, { replace: true })
      } else {
        // Utiliser la fonction utilitaire pour obtenir la route par défaut
        navigate(from || getDefaultRouteForRole(roles), { replace: true })
      }
    } catch (err) {
      console.error('Erreur de connexion:', err)
      console.error('Erreur response:', err.response)
      console.error('Erreur response data:', err.response?.data)
      
      // Extraire le message d'erreur détaillé
      let errorMessage = 'Email ou mot de passe incorrect. Veuillez réessayer.'
      
      if (!err.response && (err.request || err.code === 'ERR_NETWORK' || err.message === 'Network Error')) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez que les services backend sont démarrés (docker-compose up auth candidate …).'
      } else if (err.response?.data) {
        const responseData = err.response.data
        
        if (responseData.detail) {
          errorMessage = typeof responseData.detail === 'string' 
            ? responseData.detail 
            : JSON.stringify(responseData.detail)
        } else if (responseData.message) {
          errorMessage = typeof responseData.message === 'string'
            ? responseData.message
            : JSON.stringify(responseData.message)
        } else if (typeof responseData === 'string') {
          errorMessage = responseData
        } else if (responseData.error) {
          errorMessage = typeof responseData.error === 'string'
            ? responseData.error
            : JSON.stringify(responseData.error)
        } else {
          errorMessage = `Erreur ${err.response.status || 'inconnue'}: ${JSON.stringify(responseData)}`
        }
      } else if (err.message) {
        errorMessage = err.message
      } else if (err.request) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.'
      }
      
      // Nettoyer le message si il contient des informations techniques
      if (errorMessage.includes('HTTPException') && errorMessage.includes('detail=')) {
        const detailMatch = errorMessage.match(/detail=['"]([^'"]+)['"]/)
        if (detailMatch && detailMatch[1]) {
          errorMessage = detailMatch[1]
        }
      }
      
      // Traduire les messages d'erreur communs en français
      if (errorMessage === 'Invalid credentials' || errorMessage.includes('Invalid credentials')) {
        errorMessage = 'Email ou mot de passe incorrect. Veuillez réessayer.'
      } else if (errorMessage === 'User account is not active') {
        errorMessage = 'Votre compte n\'est pas actif. Veuillez contacter le support.'
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-light to-white flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-md">
        <Card className="rounded-[16px] shadow-xl border-0 overflow-hidden">
          <div className="p-4 sm:p-6 text-white" style={{ background: `linear-gradient(to right, #226D68, #1a5a55)` }}>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl sm:text-2xl font-bold font-heading text-white truncate">Connexion</CardTitle>
                <CardDescription className="text-white/80 mt-1 text-xs sm:text-sm">
                  Connectez-vous à votre compte Yemma Solutions
                </CardDescription>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm flex-1">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  {...register('email')}
                  disabled={isLoading}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
                {errors.email && (
                  <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
                {errors.password && (
                  <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <Link 
                  to="/reset-password" 
                  className="hover:underline transition-colors"
                  style={{ color: '#226D68' }}
                  onMouseEnter={(e) => e.target.style.color = '#1a5a55'}
                  onMouseLeave={(e) => e.target.style.color = '#226D68'}
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button 
                type="submit" 
                  className="w-full text-white h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  style={{ backgroundColor: '#226D68' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#226D68' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="hidden sm:inline">Connexion en cours...</span>
                    <span className="sm:hidden">Connexion...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t">
              <p className="text-xs sm:text-sm text-center text-muted-foreground mb-3 sm:mb-4">
                Vous n'avez pas de compte ?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <Link to="/register/candidat" className="w-full">
                  <Button variant="outline" className="w-full border-blue-deep text-blue-deep hover:bg-blue-deep/10 h-10 sm:h-11 text-xs sm:text-sm">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Candidat
                  </Button>
                </Link>
                <Link to="/register/company" className="w-full">
                  <Button variant="outline" className="w-full border-blue-deep text-blue-deep hover:bg-blue-deep/10 h-10 sm:h-11 text-xs sm:text-sm">
                    <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Entreprise
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
