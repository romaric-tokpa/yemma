import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApiService } from '@/services/api'
import { Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Mail, ArrowRight, User, Building } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { SEO } from '@/components/seo/SEO'
import RegisterCandidatIllustration from '@/components/landing/RegisterCandidatIllustration'

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

function ResetPasswordLayout({ children }) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row overflow-x-hidden w-full max-w-[100vw]">
      {/* Bande décorative gauche - style Login */}
      <div
        className="hidden lg:block w-16 lg:w-20 shrink-0"
        style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2744 100%)' }}
      />

      {/* Colonne gauche - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-[#F9FAFB] p-8">
        <RegisterCandidatIllustration />
      </div>

      {/* Colonne droite - Contenu */}
      <div className="flex-1 flex items-center justify-center p-4 xs:px-5 sm:p-6 lg:p-12 min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}

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
        navigate(ROUTES.LOGIN, {
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
      <>
        <SEO
          title="Mot de passe modifié - Yemma Solutions"
          description="Votre mot de passe a été modifié avec succès. Connectez-vous à Yemma Solutions."
          canonical={ROUTES.RESET_PASSWORD}
        />
        <ResetPasswordLayout>
          <div className="w-full max-w-[420px] min-w-0 overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 lg:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#226D68]" />
              </div>
              <h1 className="text-2xl font-bold text-[#2C2C2C] mb-2">Mot de passe modifié</h1>
              <p className="text-sm text-[#6b7280] mb-6">Redirection vers la connexion...</p>
              <span className="flex items-center justify-center gap-2 text-[#6b7280]">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#226D68] border-t-transparent" />
                Connexion...
              </span>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center flex-wrap gap-2">
              <Link to={ROUTES.HOME} className="text-sm text-[#6b7280] hover:text-[#226D68] transition-colors">
                Retour à l&apos;accueil
              </Link>
              <div className="flex gap-2">
                <Link to={ROUTES.REGISTER_CANDIDAT}>
                  <Button variant="outline" size="sm" className="h-9 text-xs border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3]">
                    <User className="w-3.5 h-3.5 mr-1.5" />Candidat
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER_COMPANY}>
                  <Button variant="outline" size="sm" className="h-9 text-xs border-[#e76f51] text-[#e76f51] hover:bg-[#FDF2F0]">
                    <Building className="w-3.5 h-3.5 mr-1.5" />Entreprise
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ResetPasswordLayout>
      </>
    )
  }

  // Écran succès après demande d'email (sans token)
  if (requestSent && !token) {
    return (
      <>
        <SEO
          title="Demande envoyée - Yemma Solutions"
          description="Vérifiez votre boîte mail pour réinitialiser votre mot de passe Yemma Solutions."
          canonical={ROUTES.RESET_PASSWORD}
        />
        <ResetPasswordLayout>
          <div className="w-full max-w-[420px] min-w-0 overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 lg:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#226D68]" />
              </div>
              <h1 className="text-2xl font-bold text-[#2C2C2C] mb-2">Demande envoyée</h1>
              <p className="text-sm text-[#6b7280] mb-6">
                Si un compte existe avec cet email, vous recevrez un lien de réinitialisation par <strong>email</strong> dans quelques minutes. Vérifiez également votre dossier spam.
              </p>
              <Link to={ROUTES.LOGIN} className="w-full">
                <Button className="w-full h-12 bg-[#226D68] hover:bg-[#1a5a55] text-white font-semibold rounded-lg text-base">
                  Retour à la connexion
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center flex-wrap gap-2">
              <Link to={ROUTES.HOME} className="text-sm text-[#6b7280] hover:text-[#226D68] transition-colors">
                Retour à l&apos;accueil
              </Link>
              <div className="flex gap-2">
                <Link to={ROUTES.REGISTER_CANDIDAT}>
                  <Button variant="outline" size="sm" className="h-9 text-xs border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3]">
                    <User className="w-3.5 h-3.5 mr-1.5" />Candidat
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER_COMPANY}>
                  <Button variant="outline" size="sm" className="h-9 text-xs border-[#e76f51] text-[#e76f51] hover:bg-[#FDF2F0]">
                    <Building className="w-3.5 h-3.5 mr-1.5" />Entreprise
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ResetPasswordLayout>
      </>
    )
  }

  // Sans token : formulaire de demande (email)
  if (!token) {
    return (
      <>
        <SEO
          title="Mot de passe oublié - Yemma Solutions"
          description="Réinitialisez votre mot de passe Yemma Solutions. Entrez votre email pour recevoir un lien de réinitialisation."
          canonical={ROUTES.RESET_PASSWORD}
        />
        <ResetPasswordLayout>
          <div className="w-full max-w-[420px] min-w-0 overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-[#2C2C2C] mb-6">Mot de passe oublié</h1>
            <p className="text-sm text-[#6b7280] mb-6">
              Entrez votre adresse email pour recevoir un lien de réinitialisation par courriel.
            </p>

            <form onSubmit={handleRequestSubmit(onRequestReset)} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-[#374151]">Adresse email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votreadresse@exemple.com"
                    {...registerRequest('email')}
                    disabled={loading}
                    className="h-11 pl-10 border-gray-200 w-full min-w-0"
                  />
                </div>
                {requestForm.formState.errors.email && (
                  <p className="text-xs text-red-600 mt-0.5">{requestForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#226D68] hover:bg-[#1a5a55] text-white font-semibold rounded-lg text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi...
                  </span>
                ) : (
                  <>
                    Envoyer le lien
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[#6b7280]">
              Vous vous souvenez de votre mot de passe ?{' '}
              <Link to={ROUTES.LOGIN} className="text-[#226D68] font-medium hover:underline">
                Se connecter
              </Link>
            </p>

            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center flex-wrap gap-2">
              <Link to={ROUTES.HOME} className="text-sm text-[#6b7280] hover:text-[#226D68] transition-colors">
                Retour à l&apos;accueil
              </Link>
              <div className="flex gap-2">
                <Link to={ROUTES.REGISTER_CANDIDAT}>
                  <Button variant="outline" size="sm" className="h-9 text-xs border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3]">
                    <User className="w-3.5 h-3.5 mr-1.5" />Candidat
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER_COMPANY}>
                  <Button variant="outline" size="sm" className="h-9 text-xs border-[#e76f51] text-[#e76f51] hover:bg-[#FDF2F0]">
                    <Building className="w-3.5 h-3.5 mr-1.5" />Entreprise
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ResetPasswordLayout>
      </>
    )
  }

  // Avec token : formulaire nouveau mot de passe
  return (
    <>
      <SEO
        title="Définir votre mot de passe - Yemma Solutions"
        description="Définissez votre nouveau mot de passe pour accéder à votre compte Yemma Solutions."
        canonical={ROUTES.RESET_PASSWORD}
      />
      <ResetPasswordLayout>
        <div className="w-full max-w-[420px] min-w-0 overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 lg:p-8">
          <h1 className="text-2xl font-bold text-[#2C2C2C] mb-6">Définir votre mot de passe</h1>
          <p className="text-sm text-[#6b7280] mb-6">
            Entrez votre nouveau mot de passe ci-dessous.
          </p>

          <form onSubmit={handleConfirmSubmit(onConfirmReset)} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{error}</p>
                  {(error.includes('expiré') || error.includes('invalide')) && (
                    <Link to={ROUTES.RESET_PASSWORD} className="text-xs text-red-600 hover:underline mt-0.5 block">
                      Demander un nouveau lien →
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-[#374151]">Nouveau mot de passe</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...registerConfirm('password')}
                  disabled={loading}
                  className="h-11 pl-10 pr-10 border-gray-200 w-full min-w-0"
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
                <p className="text-xs text-red-600 mt-0.5">{confirmErrors.password.message}</p>
              )}
              <p className="text-xs text-[#6b7280] mt-0.5">Min. 8 caractères</p>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#374151]">Confirmer le mot de passe</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...registerConfirm('confirmPassword')}
                  disabled={loading}
                  className="h-11 pl-10 pr-10 border-gray-200 w-full min-w-0"
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
                <p className="text-xs text-red-600 mt-0.5">{confirmErrors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#226D68] hover:bg-[#1a5a55] text-white font-semibold rounded-lg text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Modification...
                </span>
              ) : (
                <>
                  Définir le mot de passe
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b7280]">
            <Link to={ROUTES.LOGIN} className="text-[#226D68] font-medium hover:underline">
              Retour à la connexion
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center flex-wrap gap-2">
            <Link to={ROUTES.HOME} className="text-sm text-[#6b7280] hover:text-[#226D68] transition-colors">
              Retour à l&apos;accueil
            </Link>
            <div className="flex gap-2">
              <Link to={ROUTES.REGISTER_CANDIDAT}>
                <Button variant="outline" size="sm" className="h-9 text-xs border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3]">
                  <User className="w-3.5 h-3.5 mr-1.5" />Candidat
                </Button>
              </Link>
              <Link to={ROUTES.REGISTER_COMPANY}>
                <Button variant="outline" size="sm" className="h-9 text-xs border-[#e76f51] text-[#e76f51] hover:bg-[#FDF2F0]">
                  <Building className="w-3.5 h-3.5 mr-1.5" />Entreprise
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ResetPasswordLayout>
    </>
  )
}
