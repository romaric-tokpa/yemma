import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { authApiService, candidateApi, companyApi } from '@/services/api'
import { loginSchema } from '@/schemas/auth'
import { LogIn, AlertCircle, User, Building } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

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
            // L'onboarding est complété, rediriger vers le dashboard
            navigate('/candidate/dashboard')
          } else {
            // L'onboarding n'est pas complété, rediriger vers l'onboarding
            navigate('/onboarding')
          }
        } catch (profileError) {
          // Si le profil n'existe pas (404), rediriger vers l'onboarding
          if (profileError.response?.status === 404) {
            navigate('/onboarding')
          } else {
            console.error('Erreur lors de la récupération du profil:', profileError)
            // En cas d'erreur, rediriger vers l'onboarding par sécurité
            navigate('/onboarding')
          }
        }
      } else if (roles.includes('ROLE_COMPANY_ADMIN')) {
        // Vérifier si l'entreprise existe
        try {
          await companyApi.getMyCompany()
          // L'entreprise existe, rediriger vers le dashboard
          navigate('/company/dashboard')
        } catch (companyError) {
          // Si l'entreprise n'existe pas (404), rediriger vers l'onboarding
          if (companyError.response?.status === 404) {
            navigate('/company/onboarding')
          } else {
            console.error('Erreur lors de la récupération de l\'entreprise:', companyError)
            // En cas d'erreur, rediriger vers l'onboarding par sécurité
            navigate('/company/onboarding')
          }
        }
      } else if (roles.includes('ROLE_RECRUITER')) {
        // Les recruteurs ont accès uniquement à la recherche de candidats
        // Vérifier si l'entreprise existe (pour s'assurer que le TeamMember est bien créé)
        try {
          await companyApi.getMyCompany()
          // L'entreprise existe, rediriger directement vers la recherche
          navigate('/company/search')
        } catch (companyError) {
          // Si l'entreprise n'existe pas, il y a un problème
          console.error('Erreur: Le recruteur n\'est pas associé à une entreprise:', companyError)
          setError('Votre compte n\'est pas encore associé à une entreprise. Contactez votre administrateur.')
        }
      } else if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN')) {
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error('Erreur de connexion:', err)
      setError(
        err.response?.data?.detail || 
        'Email ou mot de passe incorrect. Veuillez réessayer.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Theme Toggle dans le coin supérieur droit */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
            <CardDescription>
              Connectez-vous à votre compte Yemma Solutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link 
                  to="/forgot-password" 
                  className="text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-center text-muted-foreground mb-4">
                Vous n'avez pas de compte ?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/register/candidat">
                  <Button variant="outline" className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    Candidat
                  </Button>
                </Link>
                <Link to="/register/company">
                  <Button variant="outline" className="w-full">
                    <Building className="w-4 h-4 mr-2" />
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
