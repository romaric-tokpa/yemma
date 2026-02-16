import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2, Lock, User, Mail } from 'lucide-react'
import { companyApi, authApiService } from '@/services/api'

const acceptInvitationSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom est trop long'),
  last_name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirm_password: z.string().min(8, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
})

export default function AcceptInvitation() {
  console.log('🔵 AcceptInvitation component is rendering')
  
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  console.log('🔵 AcceptInvitation - token from URL:', token)
  
  const [loading, setLoading] = useState(false)
  const [loadingInvitation, setLoadingInvitation] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [invitationInfo, setInvitationInfo] = useState(null)
  
  const form = useForm({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      password: '',
      confirm_password: '',
    },
  })
  
  const { register, handleSubmit, formState: { errors } } = form
  
  useEffect(() => {
    console.log('AcceptInvitation useEffect - token:', token)
    
    if (!token) {
      console.log('No token found, setting error')
      setError('Token d\'invitation manquant. Veuillez utiliser le lien reçu par email.')
      setLoadingInvitation(false)
      return
    }
    
    // Récupérer les informations de l'invitation pour afficher l'email
    const loadInvitation = async () => {
      try {
        setLoadingInvitation(true)
        console.log('Loading invitation with token:', token)
        const info = await companyApi.validateInvitation(token)
        console.log('Invitation loaded successfully:', info)
        setInvitationInfo(info)
        setError(null)
      } catch (err) {
        console.error('Error loading invitation:', err)
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url,
        })
        if (err.response?.status === 404) {
          setError('Invitation non trouvée ou expirée.')
        } else if (err.response?.status === 400) {
          setError('Cette invitation a déjà été utilisée ou est expirée.')
        } else {
          setError(`Erreur lors du chargement de l'invitation: ${err.message || 'Erreur inconnue'}`)
        }
      } finally {
        setLoadingInvitation(false)
      }
    }
    
    loadInvitation()
  }, [token])
  
  const onSubmit = async (data) => {
    if (!token) {
      setError('Token d\'invitation manquant')
      return
    }
    
    setLoading(true)
    setError(null)
    
    console.log('🔵 Submitting invitation acceptance with data:', {
      token: token.substring(0, 20) + '...',
      first_name: data.first_name,
      last_name: data.last_name,
      password_length: data.password?.length
    })
    
    try {
      // Accepter l'invitation et créer le compte
      console.log('🔵 Calling companyApi.acceptInvitation...')
      const response = await companyApi.acceptInvitation({
        token,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
      })
      console.log('🔵 Invitation accepted successfully:', response)
      
      // Récupérer l'email depuis l'invitation
      const email = invitationInfo?.email
      
      if (!email) {
        throw new Error('Impossible de récupérer l\'email de l\'invitation')
      }
      
      // Se connecter automatiquement avec l'email de l'invitation
      try {
        const loginResponse = await authApiService.login(email, data.password)
        const user = await authApiService.getCurrentUser()
        localStorage.setItem('user', JSON.stringify(user))
        
        setSuccess(true)
        
        // Rediriger vers l'espace de recherche après 2 secondes
        setTimeout(() => {
          navigate('/company/search')
        }, 2000)
      } catch (loginError) {
        // Si la connexion automatique échoue, rediriger vers la page de login
        setError('Compte créé avec succès, mais la connexion automatique a échoué. Veuillez vous connecter manuellement.')
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (err) {
      console.error('❌ Error accepting invitation:', err)
      console.error('❌ Error response:', err.response)
      console.error('❌ Error response status:', err.response?.status)
      console.error('❌ Error response data:', err.response?.data)
      console.error('❌ Error response headers:', err.response?.headers)
      console.error('❌ Error message:', err.message)
      console.error('❌ Full error object:', JSON.stringify(err, null, 2))
      
      // Extraire le message d'erreur détaillé
      let errorMessage = 'Erreur lors de la création du compte. Veuillez réessayer.'
      
      if (err.response?.data) {
        const responseData = err.response.data
        
        // Essayer plusieurs formats de réponse (FastAPI utilise 'detail' ou 'message')
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
          // Si on a une réponse mais pas de message clair, afficher le statut
          errorMessage = `Erreur ${err.response.status || 'inconnue'}: ${JSON.stringify(responseData)}`
        }
      } else if (err.message) {
        errorMessage = err.message
      } else if (err.request) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.'
      }
      
      // Nettoyer le message si il contient des informations techniques
      // Par exemple, si le message contient "HTTPException(...)", extraire juste le detail
      if (errorMessage.includes('HTTPException') && errorMessage.includes('detail=')) {
        const detailMatch = errorMessage.match(/detail=['"]([^'"]+)['"]/)
        if (detailMatch && detailMatch[1]) {
          errorMessage = detailMatch[1]
        }
      }
      
      console.error('❌ Final error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  console.log('🔵 AcceptInvitation render check - token:', token, 'loadingInvitation:', loadingInvitation, 'error:', error, 'success:', success)
  
  if (!token) {
    console.log('🔵 No token, showing error message')
    return (
      <div className="min-h-screen flex items-center justify-center p-4 px-4 xs:px-5 relative overflow-x-hidden w-full max-w-[100vw]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Lien invalide</CardTitle>
            <CardDescription className="text-center">
              Le lien d'invitation est invalide ou manquant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Aller à la page de connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 px-4 xs:px-5 relative overflow-x-hidden w-full max-w-[100vw]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#226D68]" />
              <p className="text-muted-foreground">Vérification de l'invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 px-4 xs:px-5 relative overflow-x-hidden w-full max-w-[100vw]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-[#226D68] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-anthracite mb-2">Compte créé avec succès !</h2>
              <p className="text-muted-foreground mb-4">
                Vous allez être redirigé vers votre espace de recherche...
              </p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#226D68]" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  console.log('Rendering AcceptInvitation form, invitationInfo:', invitationInfo, 'error:', error)
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 px-4 xs:px-5 relative overflow-x-hidden w-full max-w-[100vw]">
      <Card className="w-full max-w-md min-w-0 overflow-hidden">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-[#226D68]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-[#226D68]" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-anthracite font-heading">
            Créer votre compte
          </CardTitle>
          <CardDescription>
            Complétez le formulaire ci-dessous pour créer votre compte recruteur
          </CardDescription>
          {invitationInfo?.email && (
            <div className="mt-4 p-3 bg-[#226D68]/10 border border-[#226D68]/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Email du compte :</p>
              <p className="text-sm font-semibold text-gray-anthracite font-mono">{invitationInfo.email}</p>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  Prénom <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="first_name"
                    type="text"
                    placeholder="Votre prénom"
                    {...register('first_name')}
                    className="pl-10 w-full min-w-0"
                    disabled={loading || !invitationInfo}
                  />
                </div>
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="last_name"
                    type="text"
                    placeholder="Votre nom"
                    {...register('last_name')}
                    className="pl-10 w-full min-w-0"
                    disabled={loading || !invitationInfo}
                  />
                </div>
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">
                Mot de passe <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 caractères"
                  {...register('password')}
                  className="pl-10 w-full min-w-0"
                  disabled={loading || !invitationInfo}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm_password">
                Confirmer le mot de passe <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Répétez votre mot de passe"
                  {...register('confirm_password')}
                  className="pl-10 w-full min-w-0"
                  disabled={loading || !invitationInfo}
                />
              </div>
              {errors.confirm_password && (
                <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#226D68] hover:bg-[#1a5a55] text-white" 
              disabled={loading || !invitationInfo}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création du compte...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Créer mon compte
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-center text-muted-foreground">
              Vous avez déjà un compte ?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-[#226D68] hover:underline font-medium"
              >
                Se connecter
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
