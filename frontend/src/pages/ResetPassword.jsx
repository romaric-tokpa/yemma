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
import { Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string().min(8, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const token = searchParams.get('token')

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const { register, handleSubmit, formState: { errors }, watch } = form

  useEffect(() => {
    if (!token) {
      setError('Token de réinitialisation manquant. Veuillez utiliser le lien reçu par email.')
    }
  }, [token])

  const onSubmit = async (data) => {
    if (!token) {
      setError('Token de réinitialisation manquant')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await authApiService.confirmPasswordReset(token, data.password)
      
      setSuccess(true)
      
      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.' 
          } 
        })
      }, 2000)
    } catch (err) {
      console.error('Error resetting password:', err)
      
      let errorMessage = 'Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer.'
      
      if (err.response?.data) {
        const responseData = err.response.data
        if (responseData.detail) {
          errorMessage = typeof responseData.detail === 'string' 
            ? responseData.detail 
            : JSON.stringify(responseData.detail)
        } else if (responseData.message) {
          errorMessage = responseData.message
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      // Nettoyer le message si il contient des informations techniques
      if (errorMessage.includes('HTTPException') && errorMessage.includes('detail=')) {
        const detailMatch = errorMessage.match(/detail=['"]([^'"]+)['"]/)
        if (detailMatch && detailMatch[1]) {
          errorMessage = detailMatch[1]
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-light to-white flex items-center justify-center p-3 sm:p-4">
        <Card className="w-full max-w-md rounded-[16px] shadow-xl border-0 overflow-hidden animate-in fade-in zoom-in">
          <div className="p-4 sm:p-6 text-white text-center" style={{ background: `linear-gradient(to right, #226D68, #1a5a55)` }}>
            <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 animate-in zoom-in" />
            <h2 className="text-xl sm:text-2xl font-bold font-heading mb-2">Mot de passe modifié avec succès !</h2>
            <p className="text-sm sm:text-base text-white/80">
              Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion...
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
          <div className="p-4 sm:p-6 text-white" style={{ background: `linear-gradient(to right, #226D68, #1a5a55)` }}>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl sm:text-2xl font-bold font-heading text-white truncate">Définir votre mot de passe</CardTitle>
                <CardDescription className="text-white/80 mt-1 text-xs sm:text-sm">
                  Entrez votre nouveau mot de passe
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

              {!token && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm">
                  <p>Token de réinitialisation manquant. Veuillez utiliser le lien reçu par email.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Nouveau mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    disabled={loading || !token}
                    className="pr-10 h-10 sm:h-11 text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={loading || !token}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Le mot de passe doit contenir au moins 8 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    disabled={loading || !token}
                    className="pr-10 h-10 sm:h-11 text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={loading || !token}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                  className="w-full text-white h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  style={{ backgroundColor: '#226D68' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#226D68' }}
                disabled={loading || !token}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Modification en cours...</span>
                    <span className="sm:hidden">Modification...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Définir le mot de passe
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link 
                  to="/login" 
                    className="text-xs sm:text-sm hover:underline transition-colors"
                    style={{ color: '#226D68' }}
                    onMouseEnter={(e) => { e.target.style.color = '#1a5a55' }}
                    onMouseLeave={(e) => { e.target.style.color = '#226D68' }}
                >
                  Retour à la connexion
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
