import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApiService, companyApi } from '@/services/api'
import { registerCompanySchema } from '@/schemas/auth'
import { Building, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { SEO } from '@/components/seo/SEO'

const benefits = [
  'Accédez à des profils candidats vérifiés par nos experts',
  '100% des profils validés avant mise en relation',
  'Recevez 3 profils qualifiés en 48h maximum',
  'Matching et scoring pour des recrutements ciblés',
  'Essai gratuit 14 jours pour tester la plateforme',
  'Support dédié pour vos besoins de recrutement',
]

export default function RegisterCompany() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

      const registerData = {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'ROLE_COMPANY_ADMIN',
      }

      const authResponse = await authApiService.register(registerData)
      
      const user = await authApiService.getCurrentUser()
      
      try {
        await companyApi.createCompany({
          name: data.companyName,
          legal_id: data.companyLegalId,
          admin_id: user.id,
        })
      } catch (companyError) {
        console.warn('Erreur lors de la création de l\'entreprise:', companyError)
      }
      
      setSuccess(true)
      
      setTimeout(() => {
        navigate('/company/onboarding')
      }, 2000)
    } catch (err) {
      console.error('Erreur d\'inscription:', err)
      
      let errorMessage = 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.'
      
      if (err.response) {
        const status = err.response.status
        const data = err.response.data
        
        if (status === 409) {
          errorMessage = data?.detail || data?.message || 
            'Un compte avec cet email existe déjà. Veuillez vous connecter ou utiliser un autre email.'
        } else if (status === 400) {
          errorMessage = data?.detail || data?.message || 
            'Les données fournies sont invalides. Vérifiez vos informations.'
        } else if (status === 422) {
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
      <div
        className="min-h-screen min-h-[100dvh] bg-white flex items-center justify-center p-4 sm:p-6"
        style={{
          paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left, 1rem))',
          paddingRight: 'max(1rem, env(safe-area-inset-right, 1rem))',
        }}
      >
        <div className="w-full max-w-[380px] rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 text-center bg-white">
          <div className="w-16 h-16 rounded-full bg-[#226D68]/20 flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-[#226D68]" />
          </div>
          <h2 className="text-xl font-bold text-[#2C2C2C] mb-2">Inscription réussie</h2>
          <p className="text-sm text-[#6b7280]">
            Redirection vers la configuration de votre entreprise...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO
        title="Inscription Recruteur - Créer compte entreprise"
        description="Créez votre compte recruteur sur Yemma Solutions. Accédez à la CVthèque de profils préqualifiés avec matching et scoring. Essai gratuit 14 jours. Recrutez en 48h."
        keywords="inscription recruteur, créer compte entreprise, cvthèque recrutement, plateforme recrutement entreprise"
        canonical="/register/company"
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
              <Link to={ROUTES.HOME} className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                <img src="/logo-icon.svg" alt="Yemma Solutions" className="w-9 h-9 object-contain shrink-0" />
                <span className="text-base xs:text-lg font-bold truncate">
                  <span className="text-[#226D68]">Yemma</span>
                  <span className="text-[#e76f51]">-Solutions</span>
                </span>
              </Link>

              <h1 className="text-xl xs:text-2xl font-bold text-[#2C2C2C] mb-1.5">Créer un compte entreprise</h1>
              <p className="text-sm text-[#6b7280] mb-6">
                Déjà inscrit ?{' '}
                <Link to={ROUTES.LOGIN} className="text-[#226D68] font-medium hover:underline">
                  Connectez-vous
                </Link>
              </p>

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
                    <Label htmlFor="firstName" className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Prénom *</Label>
                    <Input id="firstName" {...register('firstName')} disabled={isLoading}
                      className="h-11 mt-1 border-gray-200 rounded-lg w-full min-w-0" placeholder="Jean" />
                    {errors.firstName && <p className="text-xs text-red-600 mt-0.5">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Nom *</Label>
                    <Input id="lastName" {...register('lastName')} disabled={isLoading}
                      className="h-11 mt-1 border-gray-200 rounded-lg w-full min-w-0" placeholder="Dupont" />
                    {errors.lastName && <p className="text-xs text-red-600 mt-0.5">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Email professionnel *</Label>
                  <Input id="email" type="email" placeholder="contact@entreprise.com" {...register('email')}
                    disabled={isLoading} className="h-11 mt-1 border-gray-200 rounded-lg w-full min-w-0" />
                  {errors.email && <p className="text-xs text-red-600 mt-0.5">{errors.email.message}</p>}
                </div>

                <div>
                  <Label htmlFor="companyName" className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Nom de l&apos;entreprise *</Label>
                  <Input id="companyName" placeholder="Ex: Acme Corp" {...register('companyName')}
                    disabled={isLoading} className="h-11 mt-1 border-gray-200 rounded-lg w-full min-w-0" />
                  {errors.companyName && <p className="text-xs text-red-600 mt-0.5">{errors.companyName.message}</p>}
                </div>

                <div>
                  <Label htmlFor="companyLegalId" className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">RCCM *</Label>
                  <Input id="companyLegalId" placeholder="CI-ABJ-XX-XXXX-BXX-XXXXX" {...register('companyLegalId')}
                    disabled={isLoading} className="h-11 mt-1 border-gray-200 rounded-lg w-full min-w-0" />
                  {errors.companyLegalId && <p className="text-xs text-red-600 mt-0.5">{errors.companyLegalId.message}</p>}
                  <p className="text-xs text-[#6b7280] mt-0.5">Numéro RCCM de l&apos;entreprise</p>
                </div>

                <div>
                  <Label htmlFor="password" className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Mot de passe *</Label>
                  <div className="relative mt-1">
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                      {...register('password')} disabled={isLoading}
                      className="h-11 pr-10 border-gray-200 rounded-lg w-full min-w-0" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600 mt-0.5">{errors.password.message}</p>}
                  <p className="text-xs text-[#6b7280] mt-0.5">Min. 8 caractères</p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Confirmer le mot de passe *</Label>
                  <div className="relative mt-1">
                    <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••"
                      {...register('confirmPassword')} disabled={isLoading}
                      className="h-11 pr-10 border-gray-200 rounded-lg w-full min-w-0" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-600 mt-0.5">{errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" disabled={isLoading}
                  className="w-full min-h-[48px] h-12 bg-[#226D68] hover:bg-[#1a5a55] text-white font-semibold rounded-lg text-sm sm:text-base">
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Création en cours...
                    </span>
                  ) : (
                    <>
                      <Building className="w-4 h-4 mr-2" />
                      Créer mon compte entreprise
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs sm:text-sm text-[#6b7280] break-words">
                <Link to={ROUTES.HOME} className="hover:text-[#226D68] transition-colors">
                  Retour à l&apos;accueil
                </Link>
                {' · '}
                <Link to={ROUTES.REGISTER_CANDIDAT} className="text-[#e76f51] hover:text-[#d45a3f] font-medium">
                  Je suis candidat
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
                Recrutez en 48h avec des profils qualifiés
              </h2>
            </div>
            <div className="space-y-2.5 xl:space-y-3">
              {benefits.map((benefit, i) => (
                <div key={i} className="bg-white rounded-xl p-3 xl:p-4 flex items-center gap-3 shadow-sm min-w-0">
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
