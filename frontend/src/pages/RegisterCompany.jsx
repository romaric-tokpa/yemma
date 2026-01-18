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
          // Email ou données déjà existantes
          errorMessage = data?.detail || data?.message || 
            'Cet email est déjà utilisé. Veuillez utiliser une autre adresse email ou vous connecter.'
        } else if (status === 400) {
          // Erreur de validation
          errorMessage = data?.detail || data?.message || 
            'Les données fournies sont invalides. Veuillez vérifier vos informations.'
        } else if (status === 422) {
          // Erreur de validation (Unprocessable Entity)
          const details = data?.detail
          if (Array.isArray(details)) {
            errorMessage = details.map(d => d.msg || d.message).join(', ')
          } else {
            errorMessage = details || data?.message || 'Données invalides.'
          }
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Inscription réussie !</h2>
              <p className="text-muted-foreground mb-4">
                Votre compte entreprise a été créé avec succès. Vous allez être redirigé vers votre tableau de bord...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-6 h-6" />
              <CardTitle className="text-2xl font-bold">Inscription Entreprise</CardTitle>
            </div>
            <CardDescription>
              Créez un compte entreprise pour accéder à la CVthèque de profils validés
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@entreprise.com"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                <Input
                  id="companyName"
                  placeholder="Ex: Acme Corp"
                  {...register('companyName')}
                  disabled={isLoading}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyLegalId">Numéro SIRET *</Label>
                <Input
                  id="companyLegalId"
                  placeholder="12345678901234"
                  {...register('companyLegalId')}
                  disabled={isLoading}
                />
                {errors.companyLegalId && (
                  <p className="text-sm text-destructive">{errors.companyLegalId.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Numéro SIRET de votre entreprise (14 chiffres)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
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
                <p className="text-xs text-muted-foreground">
                  Minimum 8 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Inscription en cours...
                  </>
                ) : (
                  <>
                    <Building className="w-4 h-4 mr-2" />
                    Créer mon compte entreprise
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-center text-muted-foreground mb-4">
                Vous avez déjà un compte ?
              </p>
              <div className="flex gap-2">
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Se connecter
                  </Button>
                </Link>
                <Link to="/register/candidat">
                  <Button variant="outline" className="flex-1">
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
