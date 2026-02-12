import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { authApiService } from '@/services/api'
import { Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Mail } from 'lucide-react'

const requestResetSchema = z.object({
  email: z.string().email('Email invalide'),
})

const confirmResetSchema = z.object({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string().min(8, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const token = searchParams.get('token')

  const requestForm = useForm({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: '' },
  })

  const confirmForm = useForm({
    resolver: zodResolver(confirmResetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const { register: registerRequest, handleSubmit: handleRequestSubmit } = requestForm
  const { register: registerConfirm, handleSubmit: handleConfirmSubmit, formState: { errors: confirmErrors } } = confirmForm

  const onRequestReset = async (data) => {
    try {
      setLoading(true)
      setError(null)
      await authApiService.requestPasswordReset(data.email)
      setRequestSent(true)
    } catch (err) {
      console.error('Erreur demande reset:', err)
      let msg = 'Impossible d\'envoyer la demande. Réessayez.'
      if (err.response?.data?.detail) {
        const d = err.response.data.detail
        msg = Array.isArray(d) ? d.map(e => e.msg || e.message || String(e)).join('. ') : (typeof d === 'string' ? d : JSON.stringify(d))
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        msg = 'Serveur inaccessible. Démarrez : docker-compose -f docker-compose.dev.yml up nginx auth postgres notification'
      } else if (err.response?.status === 422) {
        msg = 'Vérifiez que l\'email est valide.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const onConfirmReset = async (data) => {
    if (!token) {
      setError('Token de réinitialisation manquant')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await authApiService.confirmPasswordReset(token, data.password)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.' },
        })
      }, 2000)
    } catch (err) {
      console.error('Erreur confirmation reset:', err)
      let msg = 'Erreur lors de la réinitialisation. Veuillez réessayer.'
      if (err.response?.data?.detail) {
        const d = err.response.data.detail
        msg = Array.isArray(d) ? d.map(e => e.msg || e.message || String(e)).join('. ') : (typeof d === 'string' ? d : JSON.stringify(d))
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        msg = 'Serveur inaccessible. Démarrez : docker-compose -f docker-compose.dev.yml up nginx auth postgres notification'
      }
      if (msg.includes('Invalid or expired') || msg.includes('invalid') || msg.includes('expiré') || msg.includes('expired')) {
        msg = 'Ce lien a expiré ou est invalide. Demandez un nouveau lien.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Écran succès après confirmation
  if (success) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
        <Card className="w-full max-w-[380px] rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 text-white text-center bg-gradient-to-r from-[#226D68] to-[#1a5a55]">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-white/90" />
            <h2 className="text-lg font-bold text-white mb-1">Mot de passe modifié</h2>
            <p className="text-xs text-white/80">Redirection vers la connexion...</p>
          </div>
        </Card>
      </div>
    )
  }

  // Écran succès après demande d'email (sans token)
  if (requestSent && !token) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
        <Card className="w-full max-w-[380px] rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 text-white text-center bg-gradient-to-r from-[#226D68] to-[#1a5a55]">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-white/90" />
            <h2 className="text-lg font-bold text-white mb-1">Demande envoyée</h2>
            <p className="text-xs text-white/80 mb-4">
              Si un compte existe avec cet email, vous recevrez un lien de réinitialisation par <strong>email</strong> dans quelques minutes. Vérifiez également votre dossier spam.
            </p>
            <Link to="/login">
              <Button variant="outline" className="border-white text-white hover:bg-white/20">
                Retour à la connexion
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Sans token : formulaire de demande (email)
  if (!token) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
        <div className="w-full max-w-[380px]">
          <Card className="rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3.5 bg-gradient-to-r from-[#226D68] to-[#1a5a55]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-white">Mot de passe oublié</CardTitle>
                  <CardDescription className="text-white/90 text-xs">
                    Entrez votre email pour recevoir un lien de réinitialisation par courriel
                  </CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <form onSubmit={handleRequestSubmit(onRequestReset)} className="space-y-3">
                {error && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-xs">{error}</p>
                  </div>
                )}
                <div>
                  <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    {...registerRequest('email')}
                    disabled={loading}
                    className="h-9 text-sm mt-0.5"
                  />
                  {requestForm.formState.errors.email && (
                    <p className="text-[10px] text-red-600 mt-0.5">{requestForm.formState.errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full h-9 bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm font-semibold">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi...
                    </span>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer le lien
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="text-center mt-4 text-[10px] text-[#6b7280] flex justify-center gap-2">
            <Link to="/login" className="text-[#226D68] hover:underline">Retour à la connexion</Link>
            <span>·</span>
            <Link to="/" className="text-[#226D68] hover:underline">Accueil</Link>
          </p>
        </div>
      </div>
    )
  }

  // Avec token : formulaire nouveau mot de passe
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <div className="w-full max-w-[380px]">
        <Card className="rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#226D68] to-[#1a5a55]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white">Définir votre mot de passe</CardTitle>
                <CardDescription className="text-white/90 text-xs">Entrez votre nouveau mot de passe</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <form onSubmit={handleConfirmSubmit(onConfirmReset)} className="space-y-3">
              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">{error}</p>
                    {(error.includes('expiré') || error.includes('invalide')) && (
                      <Link to="/reset-password" className="text-[10px] text-red-600 hover:underline mt-0.5 block">
                        Demander un nouveau lien →
                      </Link>
                    )}
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="password" className="text-xs font-medium">Nouveau mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...registerConfirm('password')}
                    disabled={loading}
                    className="pr-10 h-9 text-sm mt-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmErrors.password && (
                  <p className="text-[10px] text-red-600 mt-0.5">{confirmErrors.password.message}</p>
                )}
                <p className="text-[10px] text-[#6b7280] mt-0.5">Min. 8 caractères</p>
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirmer *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...registerConfirm('confirmPassword')}
                    disabled={loading}
                    className="pr-10 h-9 text-sm mt-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmErrors.confirmPassword && (
                  <p className="text-[10px] text-red-600 mt-0.5">{confirmErrors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={loading}
                className="w-full h-9 bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm font-semibold">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Modification...
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Définir le mot de passe
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center mt-4 text-[10px] text-[#6b7280] flex justify-center gap-2">
          <Link to="/login" className="text-[#226D68] hover:underline">Retour à la connexion</Link>
          <span>·</span>
          <Link to="/" className="text-[#226D68] hover:underline">Accueil</Link>
        </p>
      </div>
    </div>
  )
}
