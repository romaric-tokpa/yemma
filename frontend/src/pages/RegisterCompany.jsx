import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApiService, companyApi } from '@/services/api'
import { registerCompanySchema } from '@/schemas/auth'
import { Building, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function RegisterCompany() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(registerCompanySchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      companyName: '',
      companyLegalId: '',
    },
  })

  const { register, handleSubmit, formState: { errors } } = form

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      setError(null)

      // Étape 1: Inscription avec le rôle ROLE_COMPANY_ADMIN
      const registerData = {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'ROLE_COMPANY_ADMIN',
      }

      const authResponse = await authApiService.register(registerData)
      
      // Étape 2: Récupérer l'utilisateur créé
      const user = await authApiService.getCurrentUser()
      
      // Étape 3: Créer l'entreprise (avec le token d'authentification)
      // Le token est automatiquement ajouté par l'intercepteur axios
      try {
        await companyApi.createCompany({
          name: data.companyName,
          legal_id: data.companyLegalId,
          admin_id: user.id, // L'ID de l'utilisateur créé
        })
      } catch (companyError) {
        // Si la création de l'entreprise échoue, continuer quand même
        // L'utilisateur peut créer l'entreprise plus tard depuis son dashboard
        console.warn('Erreur lors de la création de l\'entreprise:', companyError)
      }
      
      setSuccess(true)
      
      // Rediriger vers l'onboarding entreprise après 2 secondes
      setTimeout(() => {
        navigate('/company/onboarding')
      }, 2000)
    } catch (err) {
      console.error('Erreur d\'inscription:', err)
      
      // Gestion spécifique des erreurs
      let errorMessage = 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.'
      
      if (err.response) {
        const status = err.response.status
        const data = err.response.data
        
        if (status === 409) {
          // Conflit - utilisateur existe déjà
          errorMessage = data?.detail || data?.message || 
            'Un compte avec cet email existe déjà. Veuillez vous connecter ou utiliser un autre email.'
        } else if (status === 400) {
          // Erreur de validation
          errorMessage = data?.detail || data?.message || 
            'Les données fournies sont invalides. Veuillez vérifier vos informations.'
        } else if (status === 422) {
          // Erreur de validation (Unprocessable Entity)
          const details = data?.detail
          if (Array.isArray(details)) {
            errorMessage = details.map(d => d.msg || d.message || String(d)).join(', ')
          } else {
            errorMessage = details || data?.message || 'Les données fournies sont invalides.'
          }
        } else if (status === 500) {
          errorMessage = 'Une erreur serveur est survenue. Veuillez réessayer plus tard.'
        } else if (data?.detail) {
          errorMessage = data.detail
        } else if (data?.message) {
          errorMessage = data.message
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
      <div className="min-h-screen bg-gradient-to-br from-gray-light to-white flex items-center justify-center p-3 sm:p-4">
        <Card className="w-full max-w-md rounded-[16px] shadow-xl border-0 overflow-hidden animate-in fade-in zoom-in">
          <div className="bg-gradient-to-r from-blue-deep to-blue-deep/90 p-4 sm:p-6 text-white text-center">
            <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 animate-in zoom-in" />
            <h2 className="text-xl sm:text-2xl font-bold font-heading mb-2">Inscription réussie !</h2>
            <p className="text-sm sm:text-base text-white/80">
              Votre compte entreprise a été créé avec succès. Vous allez être redirigé vers la configuration de votre entreprise...
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-light to-white flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-md">
        <Card className="rounded-[16px] shadow-xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-deep to-blue-deep/90 p-4 sm:p-6 text-white">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Building className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl sm:text-2xl font-bold font-heading text-white truncate">Inscription Entreprise</CardTitle>
                <CardDescription className="text-white/80 mt-1 text-xs sm:text-sm">
                  Créez votre compte pour accéder à la CVthèque
                </CardDescription>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg animate-in slide-in-from-top-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium mb-1">{error}</p>
                      {error.includes('existe déjà') && (
                        <Link to="/login" className="text-xs sm:text-sm text-red-700 hover:text-red-900 underline font-medium">
                          Se connecter avec cet email →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold">Prénom *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    disabled={isLoading}
                    className="h-10 sm:h-11 text-sm sm:text-base"
                  />
                  {errors.firstName && (
                    <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold">Nom *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    disabled={isLoading}
                    className="h-10 sm:h-11 text-sm sm:text-base"
                  />
                  {errors.lastName && (
                    <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email professionnel *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@entreprise.com"
                  {...register('email')}
                  disabled={isLoading}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
                {errors.email && (
                  <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-semibold">Nom de l'entreprise *</Label>
                <Input
                  id="companyName"
                  placeholder="Ex: Acme Corp"
                  {...register('companyName')}
                  disabled={isLoading}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
                {errors.companyName && (
                  <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyLegalId" className="text-sm font-semibold">RCCM *</Label>
                <Input
                  id="companyLegalId"
                  placeholder="CI-ABJ-XX-XXXX-BXX-XXXXX"
                  {...register('companyLegalId')}
                  disabled={isLoading}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
                {errors.companyLegalId && (
                  <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.companyLegalId.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  RCCM de votre entreprise (ex. CI-ABJ-XX-XXXX-BXX-XXXXX)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Mot de passe *</Label>
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
                <p className="text-xs text-muted-foreground">
                  Minimum 8 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  disabled={isLoading}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
                {errors.confirmPassword && (
                  <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-deep hover:bg-blue-deep/90 text-white h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all duration-200 shadow-md hover:shadow-lg" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="hidden sm:inline">Inscription en cours...</span>
                    <span className="sm:hidden">Inscription...</span>
                  </>
                ) : (
                  <>
                    <Building className="w-4 h-4 mr-2" />
                    Créer mon compte entreprise
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t">
              <p className="text-xs sm:text-sm text-center text-muted-foreground mb-3 sm:mb-4">
                Vous avez déjà un compte ?
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className="w-full border-blue-deep text-blue-deep hover:bg-blue-deep/10 h-10 sm:h-11 text-xs sm:text-sm">
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Se connecter
                  </Button>
                </Link>
                <Link to="/register/candidat" className="flex-1">
                  <Button variant="outline" className="w-full border-blue-deep text-blue-deep hover:bg-blue-deep/10 h-10 sm:h-11 text-xs sm:text-sm">
                    Inscription Candidat
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
