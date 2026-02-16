import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApiService } from '@/services/api'
import { Shield, AlertCircle, ArrowLeft, CheckCircle2, Loader2, Lock } from 'lucide-react'

// Schéma de validation
const createAdminAccountSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string().min(8, 'La confirmation du mot de passe est requise'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export default function CreateAdminAccount() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  const [tokenInfo, setTokenInfo] = useState(null)
  const [success, setSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(createAdminAccountSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  })

  const { register, handleSubmit, formState: { errors }, setValue } = form

  // Valider le token au chargement
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Token d\'invitation manquant dans l\'URL')
        setIsValidatingToken(false)
        return
      }

      try {
        const info = await authApiService.validateAdminInvitationToken(token)
        setTokenInfo(info)
        setValue('email', info.email)
        setIsValidatingToken(false)
      } catch (err) {
        console.error('Erreur de validation du token:', err)
        let errorMessage = 'Token d\'invitation invalide ou expiré'
        
        if (err.response) {
          const status = err.response.status
          if (status === 404) {
            errorMessage = 'Token d\'invitation invalide ou déjà utilisé'
          } else if (status === 410) {
            errorMessage = 'Le token d\'invitation a expiré'
          } else {
            errorMessage = err.response.data?.detail || errorMessage
          }
        }
        
        setError(errorMessage)
        setIsValidatingToken(false)
      }
    }

    validateToken()
  }, [token, setValue])

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      setError(null)

      const registerData = {
        token: token,
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      }

      const registerResponse = await authApiService.registerAdminViaToken(registerData)
      
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
        navigate('/admin/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Erreur lors de la création du compte admin:', err)
      
      let errorMessage = 'Une erreur est survenue lors de la création du compte. Veuillez réessayer.'
      
      if (err.response) {
        const status = err.response.status
        const detail = err.response.data?.detail || ''
        
        if (status === 400) {
          errorMessage = detail || 'Données invalides'
        } else if (status === 404) {
          errorMessage = 'Token d\'invitation invalide ou déjà utilisé'
        } else if (status === 410) {
          errorMessage = 'Le token d\'invitation a expiré'
        } else if (status === 409) {
          errorMessage = detail || 'Un compte avec cet email existe déjà'
        } else if (status >= 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.'
        } else {
          errorMessage = detail || errorMessage
        }
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.'
      }
      
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 px-4 xs:px-5 safe-y overflow-x-hidden w-full max-w-[100vw]">
        <Card className="w-full max-w-md border border-border shadow-sm rounded-lg">
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#226D68]" />
              <p className="text-[10px] text-muted-foreground text-center">
                Validation du token d'invitation...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !tokenInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 px-4 xs:px-5 safe-y overflow-x-hidden w-full max-w-[100vw]">
        <Card className="w-full max-w-md border border-red-200 shadow-sm rounded-lg bg-red-50/50">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <CardTitle className="text-sm font-bold text-red-900">Erreur</CardTitle>
            <CardDescription className="text-[10px] mt-1 text-red-700">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Link to="/login">
              <Button className="w-full h-8 text-xs border-red-300 hover:bg-red-100" variant="outline">
                <ArrowLeft className="mr-1.5 h-3 w-3" />
                Retour à la connexion
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 px-4 xs:px-5 safe-y overflow-x-hidden w-full max-w-[100vw]">
        <Card className="w-full max-w-md border border-green-200 shadow-sm rounded-lg bg-green-50/50">
          <CardContent className="pt-5 pb-5 px-4">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <h2 className="text-sm font-bold text-center text-green-900">Compte créé avec succès !</h2>
              <p className="text-[10px] text-green-700 text-center">
                Redirection vers le tableau de bord administrateur...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 px-4 xs:px-5 safe-y overflow-x-hidden w-full max-w-[100vw]">
      <Card className="w-full max-w-md min-w-0 overflow-hidden border border-border shadow-sm rounded-lg bg-card">
        <CardHeader className="text-center pb-2.5 px-4 pt-4">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#226D68]/10">
            <Shield className="h-4 w-4 text-[#226D68]" />
          </div>
          <CardTitle className="text-sm font-bold">Créer un compte administrateur</CardTitle>
          <CardDescription className="text-[10px] mt-0.5">
            Vous avez été invité à créer un compte administrateur sécurisé
          </CardDescription>
          {tokenInfo && (
            <div className="mt-2.5 rounded-lg bg-[#E8F4F3] p-2 text-left border border-[#226D68]/20">
              <p className="text-[9px] text-[#226D68] font-semibold mb-1 uppercase tracking-wider">Informations d'invitation</p>
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-700">
                  <span className="font-medium">Email :</span> {tokenInfo.email}
                </p>
                <p className="text-[10px] text-gray-700">
                  <span className="font-medium">Rôle :</span> {tokenInfo.role === 'ROLE_SUPER_ADMIN' ? 'Super Administrateur' : 'Administrateur'}
                </p>
                <p className="text-[10px] text-gray-700">
                  <span className="font-medium">Expire le :</span> {new Date(tokenInfo.expires_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            {error && (
              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-red-600">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] flex-1">{error}</p>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px]">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...register('email')}
                disabled={true}
                className="h-8 text-xs bg-[#E8F4F3] cursor-not-allowed w-full min-w-0"
              />
              {errors.email && (
                <p className="text-[9px] text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-[10px]">Prénom <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Jean"
                  {...register('firstName')}
                  className="h-8 text-xs w-full min-w-0"
                />
                {errors.firstName && (
                  <p className="text-[9px] text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-[10px]">Nom <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Dupont"
                  {...register('lastName')}
                  className="h-8 text-xs w-full min-w-0"
                />
                {errors.lastName && (
                  <p className="text-[9px] text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-[10px]">Mot de passe <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="h-8 text-xs pr-8 w-full min-w-0"
                  autoComplete="new-password"
                />
                <Lock className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
              </div>
              {errors.password && (
                <p className="text-[9px] text-red-500">{errors.password.message}</p>
              )}
              <p className="text-[9px] text-muted-foreground">
                Minimum 8 caractères requis
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-[10px]">Confirmer le mot de passe <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className="h-8 text-xs pr-8 w-full min-w-0"
                  autoComplete="new-password"
                />
                <Lock className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
              </div>
              {errors.confirmPassword && (
                <p className="text-[9px] text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                className="w-full h-8 text-xs bg-[#226D68] hover:bg-[#1a5a55] text-white shadow-sm"
                disabled={isLoading || !tokenInfo}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Shield className="mr-1.5 h-3 w-3" />
                    Créer le compte administrateur
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-2.5 pt-2.5 border-t border-border">
            <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground mb-2">
              <Lock className="h-2.5 w-2.5 text-[#226D68]" />
              <span>Connexion sécurisée via token d'invitation</span>
            </div>
            <Link to="/login" className="text-[10px] text-muted-foreground hover:text-[#226D68] inline-flex items-center gap-1 justify-center w-full">
              <ArrowLeft className="h-3 w-3" />
              Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
