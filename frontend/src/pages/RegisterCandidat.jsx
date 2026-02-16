import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { authApiService } from '@/services/api'
import { registerCandidatSchema } from '@/schemas/auth'
import { UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { SEO } from '@/components/seo/SEO'

const benefits = [
  '+10 700 profils préqualifiés dans la CVthèque',
  '+500 entreprises recrutent sur Yemma',
  'Profils validés par des experts RH',
  'Choisissez la visibilité de votre profil',
  'Matching et scoring pour des opportunités ciblées',
  'Inscription 100% gratuite pour les candidats',
  'Offres d\'emploi dans tous les secteurs',
]

export default function RegisterCandidat() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm({
    resolver: zodResolver(registerCandidatSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      acceptCGU: false,
      newsletter: false,
    },
  })

  const { register, handleSubmit, control, formState: { errors } } = form

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
      <div
        className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6"
        style={{
          paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left, 1rem))',
          paddingRight: 'max(1rem, env(safe-area-inset-right, 1rem))',
        }}
      >
        <div className="w-full max-w-[380px] rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 text-center bg-white">
          <div className="w-16 h-16 rounded-full bg-[#226D68]/20 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-[#226D68]" />
          </div>
          <h2 className="text-xl font-bold text-[#2C2C2C] mb-2">Inscription réussie</h2>
          <p className="text-sm text-[#6b7280]">
            Redirection vers la création de votre profil...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO
        title="Inscription Candidat - Créer mon profil emploi"
        description="Créez votre profil candidat sur Yemma Solutions. Inscription gratuite. Profil validé par des experts, visible par les recruteurs. Trouvez votre prochain emploi."
        keywords="inscription candidat, créer profil emploi, postuler emploi, CV candidat, recherche emploi"
        canonical="/register/candidat"
      />
      <div
        className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row overflow-x-hidden w-full max-w-[100vw]"
        style={{
          paddingLeft: 'max(0px, env(safe-area-inset-left))',
          paddingRight: 'max(0px, env(safe-area-inset-right))',
        }}
      >
        {/* Colonne gauche - Bande sombre + Formulaire */}
        <div className="flex-1 flex min-w-0 overflow-x-hidden overflow-y-auto w-full">
          {/* Bande décorative sombre */}
          <div
            className="hidden lg:block w-4 lg:w-6 shrink-0"
            style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2744 100%)' }}
          />
          <div
            className="flex-1 flex items-center justify-center w-full min-w-0 px-4 xs:px-5 sm:px-8 lg:px-10 xl:px-12 py-6 xs:py-8 sm:py-10 lg:py-12"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          >
            <div className="w-full max-w-[480px] min-w-0 overflow-hidden">
              {/* Logo - aligné navbar */}
              <Link to={ROUTES.HOME} className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                <img
                  src="/logo-icon.svg"
                  alt="Yemma Solutions"
                  className="w-9 h-9 object-contain shrink-0"
                />
                <span className="text-base xs:text-lg font-bold truncate">
                  <span className="text-[#226D68]">Yemma</span>
                  <span className="text-[#e76f51]">-Solutions</span>
                </span>
              </Link>

              <h1 className="text-xl xs:text-2xl font-bold text-[#2C2C2C] mb-1.5">Je crée mon compte</h1>
              <p className="text-sm text-[#6b7280] mb-6">
                Déjà inscrit ?{' '}
                <Link to={ROUTES.LOGIN} className="text-[#226D68] font-medium hover:underline">
                  Connectez-vous
                </Link>
              </p>

              {/* Boutons sociaux - grille pour éviter la troncature du texte LinkedIn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 min-w-0 border-2 border-gray-200 hover:bg-gray-50 text-[#2C2C2C] rounded-xl font-medium flex items-center justify-center gap-2.5 px-4"
                  onClick={handleGoogleOAuth}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="truncate text-sm sm:text-base">S&apos;inscrire avec Google</span>
                </Button>
                <Button
                  type="button"
                  className="w-full h-11 min-w-0 border-2 border-[#0A66C2] bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-medium flex items-center justify-center gap-2.5 px-4"
                  onClick={handleLinkedInOAuth}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="truncate text-sm sm:text-base">S&apos;inscrire avec LinkedIn</span>
                </Button>
              </div>

              <div className="relative py-2 mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-transparent px-3 text-sm text-[#6b7280] font-medium">OU</span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{error}</p>
                      {error.includes('existe déjà') && (
                        <Link to={ROUTES.LOGIN} className="text-xs text-red-600 hover:underline mt-0.5 block">
                          Se connecter avec cet email →
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Prénom</Label>
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      disabled={isLoading}
                      className="h-11 mt-1 border-gray-200 rounded-lg w-full min-w-0"
                      placeholder="Prénom"
                    />
                    {errors.firstName && <p className="text-xs text-red-600 mt-0.5">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Nom</Label>
                    <Input
                      id="lastName"
                      {...register('lastName')}
                      disabled={isLoading}
                      className="h-11 mt-1 border-gray-200 rounded-lg w-full min-w-0"
                      placeholder="Nom"
                    />
                    {errors.lastName && <p className="text-xs text-red-600 mt-0.5">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="E-mail"
                    {...register('email')}
                    disabled={isLoading}
                    className="h-11 mt-1 border-gray-200 rounded-lg w-full min-w-0"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-0.5">{errors.email.message}</p>}
                </div>

                <div>
                  <Label htmlFor="password" className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Mot de passe</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mot de passe"
                      {...register('password')}
                      disabled={isLoading}
                      className="h-11 pr-10 border-gray-200 rounded-lg w-full min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600 mt-0.5">{errors.password.message}</p>}
                  <p className="text-xs text-[#6b7280] mt-0.5">Min. 8 caractères</p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Confirmer le mot de passe</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirmer le mot de passe"
                      {...register('confirmPassword')}
                      disabled={isLoading}
                      className="h-11 pr-10 border-gray-200 rounded-lg w-full min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-600 mt-0.5">{errors.confirmPassword.message}</p>}
                </div>

                <div className="flex items-start gap-3">
                  <Controller
                    name="acceptCGU"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="acceptCGU"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5 shrink-0 border-gray-300 data-[state=checked]:bg-[#226D68] data-[state=checked]:border-[#226D68]"
                      />
                    )}
                  />
                  <Label htmlFor="acceptCGU" className="text-xs sm:text-sm text-[#374151] leading-relaxed cursor-pointer min-w-0 break-words">
                    Pour créer mon compte, j&apos;accepte les{' '}
                    <Link to={ROUTES.LEGAL_TERMS} className="text-[#226D68] font-medium hover:underline">
                      conditions générales d&apos;utilisation
                    </Link>
                    {' '}ainsi que la{' '}
                    <Link to={ROUTES.LEGAL_PRIVACY} className="text-[#226D68] font-medium hover:underline">
                      politique de protection des données
                    </Link>
                    .
                  </Label>
                </div>
                {errors.acceptCGU && <p className="text-xs text-red-600 mt-0.5">{errors.acceptCGU.message}</p>}

                <div className="flex items-start gap-3">
                  <Controller
                    name="newsletter"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="newsletter"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5 shrink-0 border-gray-300 data-[state=checked]:bg-[#226D68] data-[state=checked]:border-[#226D68]"
                      />
                    )}
                  />
                  <Label htmlFor="newsletter" className="text-xs sm:text-sm text-[#374151] leading-relaxed cursor-pointer min-w-0 break-words">
                    Je souhaite recevoir par e-mail les actualités sur le recrutement et les opportunités de Yemma, les avantages exclusifs ainsi qu&apos;un récapitulatif personnalisé de mon utilisation de la plateforme.
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[48px] h-12 bg-[#226D68] hover:bg-[#1a5a55] text-white font-semibold rounded-lg text-sm sm:text-base"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Inscription...
                    </span>
                  ) : (
                    'Créer mon compte'
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs sm:text-sm text-[#6b7280] break-words">
                <Link to={ROUTES.HOME} className="hover:text-[#226D68] transition-colors">
                  Retour à l&apos;accueil
                </Link>
                {' · '}
                <Link to={ROUTES.REGISTER_COMPANY} className="text-[#e76f51] hover:text-[#d45a3f] font-medium">
                  Je suis une entreprise
                </Link>
              </p>

              {/* Avantages - version mobile / tablette */}
              <div className="mt-8 lg:hidden p-4 sm:p-5 rounded-xl bg-[#E8F4F3] border border-[#226D68]/20">
                <p className="text-sm font-semibold text-[#226D68] mb-3">Pourquoi rejoindre Yemma ?</p>
                <ul className="space-y-2">
                  {benefits.slice(0, 4).map((b, i) => (
                    <li key={i} className="flex items-start sm:items-center gap-2 text-xs sm:text-sm text-[#374151]">
                      <span className="w-4 h-4 rounded-full bg-[#226D68] flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite - Avantages (desktop) */}
        <div
          className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col items-center justify-center p-6 xl:p-10 overflow-y-auto"
          style={{ backgroundColor: '#226D68' }}
        >
          <div className="w-full max-w-[380px] xl:max-w-[400px]">
            <div className="bg-white rounded-2xl p-5 xl:p-6 mb-6 xl:mb-8 shadow-lg">
              <h2 className="text-lg xl:text-xl font-bold text-[#2C2C2C] text-center">
                Yemma est 100% gratuit pour les candidats !
              </h2>
            </div>
            <div className="space-y-2.5 xl:space-y-3">
              {benefits.map((benefit, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-3 xl:p-4 flex items-center gap-3 shadow-sm min-w-0"
                >
                  <div className="w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-[#226D68] flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 xl:w-4 xl:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[#2C2C2C] font-medium text-xs xl:text-sm min-w-0">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
