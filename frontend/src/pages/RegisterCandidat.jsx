import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { authApiService } from '@/services/api'
import { registerCandidatSchema } from '@/schemas/auth'
import { UserPlus, AlertCircle, ArrowLeft, CheckCircle2, Users, Building } from 'lucide-react'

export default function RegisterCandidat() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(registerCandidatSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  })

  const { register, handleSubmit, formState: { errors } } = form

  // Gestion des erreurs OAuth renvoyées par le callback
  useEffect(() => {
    const oauthError = searchParams.get('oauth_error')
    const message = searchParams.get('message')
    const detail = searchParams.get('detail')
    if (oauthError === 'email_exists' || message === 'exists_password') {
      setError('Un compte avec cet email existe déjà. Connectez-vous avec votre mot de passe.')
      window.history.replaceState({}, '', '/register/candidat')
    } else if (oauthError === 'token_exchange') {
      setError(detail
        ? `Échec de l'échange avec Google : ${detail}. Vérifiez le Client Secret dans .env et redémarrez le service auth.`
        : "Échec de l'échange avec Google. Vérifiez le Client Secret dans .env et redémarrez le service auth.")
      window.history.replaceState({}, '', '/register/candidat')
    } else if (oauthError === 'server_error') {
      setError(detail
        ? `Erreur serveur : ${detail}. Exécutez la migration : docker-compose -f docker-compose.dev.yml exec auth alembic upgrade head`
        : "Erreur serveur lors de la connexion Google. Exécutez la migration : docker-compose -f docker-compose.dev.yml exec auth alembic upgrade head")
      window.history.replaceState({}, '', '/register/candidat')
    }
  }, [searchParams])

  const handleGoogleOAuth = () => authApiService.redirectToGoogleOAuth()
  const handleLinkedInOAuth = () => authApiService.redirectToLinkedInOAuth()

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      setError(null)

      const registerData = {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'ROLE_CANDIDAT',
      }

      const registerResponse = await authApiService.register(registerData)
      
      if (registerResponse.access_token) {
        localStorage.setItem('auth_token', registerResponse.access_token)
        if (registerResponse.refresh_token) {
          localStorage.setItem('refresh_token', registerResponse.refresh_token)
        }
        
        const user = await authApiService.getCurrentUser()
        localStorage.setItem('user', JSON.stringify(user))
      }
      
      setSuccess(true)
      
      setTimeout(() => {
        navigate('/onboarding')
      }, 2000)
    } catch (err) {
      console.error('Erreur d\'inscription:', err)

      let errorMessage = 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.'

      const isNetworkError =
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('Network Error') ||
        err.message?.includes('Connection refused') ||
        (err.request && !err.response)
      if (isNetworkError) {
        errorMessage =
          'Impossible de contacter le serveur. Vérifiez que le service d\'authentification est démarré.'
      } else if (err.response) {
        const status = err.response.status
        const detail = err.response.data?.detail || ''
        
        if (status === 409) {
          errorMessage = detail || 'Un compte avec cet email existe déjà. Veuillez vous connecter ou utiliser un autre email.'
        } else if (status === 400) {
          errorMessage = detail || 'Les données fournies sont invalides. Vérifiez vos informations.'
        } else if (status === 422) {
          const errors = err.response.data?.detail || []
          if (Array.isArray(errors) && errors.length > 0) {
            errorMessage = errors.map(e => e.msg || e.message || String(e)).join(', ')
          } else {
            errorMessage = detail || 'Les données fournies sont invalides.'
          }
        } else if (status === 500) {
          errorMessage = 'Une erreur serveur est survenue. Veuillez réessayer plus tard.'
        } else if (detail) {
          errorMessage = detail
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
        <Card className="w-full max-w-[380px] rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 text-white text-center bg-gradient-to-r from-[#226D68] to-[#1a5a55]">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-white/90" />
            <h2 className="text-lg font-bold text-white mb-1">Inscription réussie</h2>
            <p className="text-xs text-white/80">
              Redirection vers la création de votre profil...
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <Card className="rounded-xl shadow-sm border border-[#E8F4F3] overflow-hidden bg-white">
          <div className="px-5 py-4 bg-gradient-to-r from-[#226D68] to-[#1a5a55]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">Inscription Candidat</CardTitle>
                <CardDescription className="text-white/90 text-sm">Créez votre compte pour accéder à la plateforme</CardDescription>
              </div>
            </div>
          </div>
          
          <CardContent className="p-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{error}</p>
                    {error.includes('existe déjà') && (
                      <Link to="/login" className="text-xs text-red-600 hover:underline mt-0.5 block">
                        Se connecter avec cet email →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-[#2C2C2C]">Prénom *</Label>
                  <Input id="firstName" {...register('firstName')} disabled={isLoading}
                    className="h-10 text-sm mt-1.5 border-[#E8F4F3] focus:border-[#226D68]" />
                  {errors.firstName && <p className="text-xs text-red-600 mt-0.5">{errors.firstName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-[#2C2C2C]">Nom *</Label>
                  <Input id="lastName" {...register('lastName')} disabled={isLoading}
                    className="h-10 text-sm mt-1.5 border-[#E8F4F3] focus:border-[#226D68]" />
                  {errors.lastName && <p className="text-xs text-red-600 mt-0.5">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-[#2C2C2C]">Email *</Label>
                <Input id="email" type="email" placeholder="votre@email.com" {...register('email')}
                  disabled={isLoading} className="h-10 text-sm mt-1.5 border-[#E8F4F3] focus:border-[#226D68]" />
                {errors.email && <p className="text-xs text-red-600 mt-0.5">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-[#2C2C2C]">Mot de passe *</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register('password')}
                  disabled={isLoading} className="h-10 text-sm mt-1.5 border-[#E8F4F3] focus:border-[#226D68]" />
                {errors.password && <p className="text-xs text-red-600 mt-0.5">{errors.password.message}</p>}
                <p className="text-xs text-[#6b7280] mt-0.5">Min. 8 caractères</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#2C2C2C]">Confirmer *</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')}
                  disabled={isLoading} className="h-10 text-sm mt-1.5 border-[#E8F4F3] focus:border-[#226D68]" />
                {errors.confirmPassword && <p className="text-xs text-red-600 mt-0.5">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" disabled={isLoading}
                className="w-full h-10 bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm font-semibold rounded-lg">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Inscription...
                  </span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Créer mon compte
                  </>
                )}
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#E8F4F3]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-[#6b7280] font-medium">ou continuer avec</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-[#E8F4F3] hover:bg-[#E8F4F3]/50 text-[#2C2C2C] rounded-lg"
                  onClick={handleGoogleOAuth}
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-[#E8F4F3] hover:bg-[#E8F4F3]/50 text-[#0A66C2] hover:text-[#0A66C2] rounded-lg"
                  onClick={handleLinkedInOAuth}
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </Button>
              </div>
            </form>

            <div className="mt-5 pt-5 border-t border-[#E8F4F3]">
              <p className="text-xs text-[#6b7280] text-center mb-3">Vous avez déjà un compte ?</p>
              <div className="flex gap-2">
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className="w-full h-9 text-xs border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3] rounded-lg">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />Se connecter
                  </Button>
                </Link>
                <Link to="/register/company" className="flex-1">
                  <Button variant="outline" className="w-full h-9 text-xs border-[#e76f51] text-[#e76f51] hover:bg-[#FDF2F0] rounded-lg">
                    <Building className="w-3.5 h-3.5 mr-1.5" />Entreprise
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="text-center mt-4 text-xs text-[#6b7280]">
          <Link to="/" className="text-[#226D68] hover:underline font-medium">Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  )
}
