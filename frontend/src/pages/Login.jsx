import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { ROUTES, getDefaultRouteForRole } from '@/constants/routes'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApiService, candidateApi, companyApi } from '@/services/api'
import { loginSchema } from '@/schemas/auth'
import { AlertCircle, Mail, Lock, User, Building, ArrowRight } from 'lucide-react'
import { SEO } from '@/components/seo/SEO'
import PublicNavbar from '@/components/layout/PublicNavbar'
import RegisterCandidatIllustration from '@/components/landing/RegisterCandidatIllustration'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const from = location.state?.from || null
  const successMessage = location.state?.message || null

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const { register, handleSubmit, formState: { errors } } = form

  const handleGoogleOAuth = () => authApiService.redirectToGoogleOAuth()
  const handleLinkedInOAuth = () => authApiService.redirectToLinkedInOAuth()

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      setError(null)
      await authApiService.login(data.email, data.password)
      const user = await authApiService.getCurrentUser()
      localStorage.setItem('user', JSON.stringify(user))
      const roles = user.roles || []

      if (roles.includes('ROLE_CANDIDAT')) {
        try {
          const profile = await candidateApi.getMyProfile()
          const isOnboardingComplete = profile.status !== 'DRAFT' || (profile.last_step_completed !== null && profile.last_step_completed >= 7)
          navigate(from || (isOnboardingComplete ? ROUTES.CANDIDATE_DASHBOARD : ROUTES.ONBOARDING), { replace: true })
        } catch (e) {
          navigate(ROUTES.ONBOARDING, { replace: true })
        }
      } else if (roles.includes('ROLE_COMPANY_ADMIN')) {
        try {
          await companyApi.getMyCompany()
          navigate(from || ROUTES.COMPANY_DASHBOARD, { replace: true })
        } catch (e) {
          navigate(ROUTES.COMPANY_ONBOARDING, { replace: true })
        }
      } else if (roles.includes('ROLE_RECRUITER')) {
        try {
          await companyApi.getMyCompany()
          navigate(from || ROUTES.COMPANY_DASHBOARD, { replace: true })
        } catch (e) {
          setError('Votre compte n\'est pas encore associé à une entreprise. Contactez votre administrateur.')
        }
      } else if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN')) {
        navigate(from || ROUTES.ADMIN_DASHBOARD, { replace: true })
      } else {
        navigate(from || getDefaultRouteForRole(roles), { replace: true })
      }
    } catch (err) {
      let msg = 'Email ou mot de passe incorrect. Veuillez réessayer.'
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        msg = 'Impossible de contacter le serveur. Vérifiez votre connexion.'
      } else if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail)
      }
      if (msg === 'Invalid credentials' || msg.includes('Invalid credentials')) msg = 'Email ou mot de passe incorrect. Veuillez réessayer.'
      if (msg === 'User account is not active') msg = 'Compte inactif. Contactez le support.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SEO
        title="Connexion - Plateforme recrutement"
        description="Connectez-vous à Yemma Solutions. Accédez à votre espace candidat ou recruteur. Plateforme de recrutement, CVthèque, profils vérifiés."
        keywords="connexion recrutement, login Yemma, espace candidat, espace recruteur"
        canonical="/login"
      />
      <PublicNavbar variant="light" />
      <div className="min-h-screen min-h-[100dvh] bg-white flex flex-col lg:flex-row overflow-x-hidden w-full max-w-[100vw] pt-14 md:pt-16">
        {/* Bande décorative gauche - style capture */}
        <div
          className="hidden lg:block w-16 lg:w-20 shrink-0"
          style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2744 100%)' }}
        />

        {/* Colonne gauche - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-[#F9FAFB] p-8">
          <RegisterCandidatIllustration />
        </div>

        {/* Colonne droite - Formulaire */}
        <div className="flex-1 flex items-center justify-center p-4 xs:px-5 sm:p-6 lg:p-12 min-w-0 overflow-x-hidden">
          <div className="w-full max-w-[480px] min-w-0 bg-white rounded-xl shadow-lg border border-gray-100 p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-[#2C2C2C] mb-6">Se connecter</h1>

            {/* Boutons sociaux - Google et LinkedIn (empilés pour éviter toute troncature) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 min-w-0 border-2 border-gray-200 hover:bg-gray-50 text-[#2C2C2C] rounded-xl font-medium flex items-center justify-center gap-2.5 px-4"
                onClick={handleGoogleOAuth}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="truncate text-sm sm:text-base">Se connecter avec Google</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 min-w-0 border-2 border-[#0A66C2] bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-medium flex items-center justify-center gap-2.5 px-4"
                onClick={handleLinkedInOAuth}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="truncate text-sm sm:text-base">Se connecter avec LinkedIn</span>
              </Button>
            </div>

            <div className="relative py-2 mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm text-[#6b7280]">ou</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {successMessage && !error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800">
                  <p className="text-sm">{successMessage}</p>
                </div>
              )}
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
                    {...register('email')}
                    disabled={isLoading}
                    className="h-11 pl-10 border-gray-200 bg-[#F4F6F8]/50 focus:bg-white rounded-xl w-full min-w-0"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-600 mt-0.5">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-[#374151]">Mot de passe</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Votre mot de passe"
                    {...register('password')}
                    disabled={isLoading}
                    className="h-11 pl-10 border-gray-200 bg-[#F4F6F8]/50 focus:bg-white rounded-xl w-full min-w-0"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-600 mt-0.5">{errors.password.message}</p>}
              </div>

              <div className="text-right">
                <Link to={ROUTES.RESET_PASSWORD} className="text-sm text-[#226D68] hover:underline font-medium">
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#226D68] hover:bg-[#1a5a55] text-white font-semibold rounded-xl text-base"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Connexion...
                  </span>
                ) : (
                  <>
                    CONNEXION
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[#6b7280]">
              Vous n&apos;avez pas de compte ?{' '}
              <Link to={ROUTES.REGISTER_CANDIDAT} className="text-[#226D68] font-medium hover:underline">
                S&apos;inscrire
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
        </div>
      </div>
    </>
  )
}
