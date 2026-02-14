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
import { Building, AlertCircle, ArrowLeft, CheckCircle2, Users, Shield, Zap } from 'lucide-react'
import { SEO } from '@/components/seo/SEO'

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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[#226D68]" />
          <h2 className="text-xl font-bold text-[#2C2C2C] mb-2">Inscription réussie</h2>
          <p className="text-sm text-[#6b7280] mb-4">
            Redirection vers la configuration de votre entreprise...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#226D68] border-t-transparent mx-auto" />
        </div>
      </div>
    )
  }

  const benefits = [
    { icon: Users, text: 'Accédez à des profils candidats vérifiés par nos experts' },
    { icon: Shield, text: '100% des profils validés avant mise en relation' },
    { icon: Zap, text: 'Recevez 3 profils qualifiés en 48h maximum' },
  ]

  return (
    <>
      <SEO
        title="Inscription Recruteur - Créer compte entreprise"
        description="Créez votre compte recruteur sur Yemma Solutions. Accédez à la CVthèque de profils préqualifiés avec matching et scoring. Essai gratuit 14 jours. Recrutez en 48h."
        keywords="inscription recruteur, créer compte entreprise, cvthèque recrutement, plateforme recrutement entreprise"
        canonical="/register/company"
      />
      <div className="min-h-screen min-h-[100dvh] bg-white flex flex-col lg:flex-row overflow-x-hidden w-full max-w-[100vw]">
        {/* Colonne gauche - Proposition de valeur */}
        <div className="lg:w-1/2 bg-[#F4F6F8] flex flex-col justify-center px-4 xs:px-5 sm:px-6 py-12 lg:py-0 lg:px-16 min-w-0 overflow-x-hidden">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 mb-12 lg:mb-16">
            <div className="w-9 h-9 rounded-full bg-[#226D68] flex items-center justify-center">
              <span className="text-white font-bold text-sm">Y</span>
            </div>
            <span className="text-lg font-bold">
              <span className="text-[#226D68]">Yemma</span>
              <span className="text-[#e76f51]">-Solutions</span>
            </span>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] mb-4 leading-tight">
              Accédez à la CVthèque de profils préqualifiés
              <br />
              <span className="text-[#226D68]">en 48h</span>
            </h1>
            <p className="text-[#6b7280] mb-8 max-w-md">
              Rejoignez la plateforme de recrutement qui connecte les entreprises aux candidats qualifiés et vérifiés.
            </p>
            <ul className="space-y-4">
              {benefits.map((item, i) => {
                const Icon = item.icon
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E8F4F3] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#226D68]" />
                    </div>
                    <span className="text-sm text-[#374151] pt-2">{item.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Colonne droite - Formulaire */}
        <div className="lg:w-1/2 flex flex-col justify-center px-4 xs:px-5 sm:px-6 py-12 lg:py-0 lg:px-16 min-w-0 overflow-x-hidden">
          <div className="max-w-md w-full mx-auto min-w-0 overflow-hidden">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-[#2C2C2C] mb-1">Créer un compte entreprise</h2>
              <p className="text-sm text-[#6b7280]">
                Accédez à la CVthèque et recrutez en toute confiance.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{error}</p>
                    {error.includes('existe déjà') && (
                      <Link to={ROUTES.LOGIN} className="text-xs text-red-600 hover:underline mt-1 block">
                        Se connecter avec cet email →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-[#374151]">Prénom *</Label>
                  <Input id="firstName" {...register('firstName')} disabled={isLoading}
                    className="h-10 text-sm mt-1 border-gray-200 w-full min-w-0" placeholder="Jean" />
                  {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-[#374151]">Nom *</Label>
                  <Input id="lastName" {...register('lastName')} disabled={isLoading}
                    className="h-10 text-sm mt-1 border-gray-200 w-full min-w-0" placeholder="Dupont" />
                  {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-[#374151]">Email professionnel *</Label>
                <Input id="email" type="email" placeholder="contact@entreprise.com" {...register('email')}
                  disabled={isLoading} className="h-10 text-sm mt-1 border-gray-200 w-full min-w-0" />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="companyName" className="text-sm font-medium text-[#374151]">Nom de l&apos;entreprise *</Label>
                <Input id="companyName" placeholder="Ex: Acme Corp" {...register('companyName')}
                  disabled={isLoading} className="h-10 text-sm mt-1 border-gray-200 w-full min-w-0" />
                {errors.companyName && <p className="text-xs text-red-600 mt-1">{errors.companyName.message}</p>}
              </div>

              <div>
                <Label htmlFor="companyLegalId" className="text-sm font-medium text-[#374151]">RCCM *</Label>
                <Input id="companyLegalId" placeholder="CI-ABJ-XX-XXXX-BXX-XXXXX" {...register('companyLegalId')}
                  disabled={isLoading} className="h-10 text-sm mt-1 border-gray-200 w-full min-w-0" />
                {errors.companyLegalId && <p className="text-xs text-red-600 mt-1">{errors.companyLegalId.message}</p>}
                <p className="text-xs text-[#6b7280] mt-1">Numéro RCCM de l&apos;entreprise</p>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-[#374151]">Mot de passe *</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register('password')}
                  disabled={isLoading} className="h-10 text-sm mt-1 border-gray-200 w-full min-w-0" />
                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
                <p className="text-xs text-[#6b7280] mt-1">Minimum 8 caractères</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#374151]">Confirmer le mot de passe *</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')}
                  disabled={isLoading} className="h-10 text-sm mt-1 border-gray-200 w-full min-w-0" />
                {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" disabled={isLoading}
                className="w-full h-11 bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm font-semibold mt-2">
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

            <p className="text-center text-sm text-[#6b7280] mt-6">
              Vous avez déjà un compte ?{' '}
              <Link to={ROUTES.LOGIN} className="font-medium text-[#226D68] hover:underline">
                Se connecter
              </Link>
            </p>

            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center gap-4">
              <Link to={ROUTES.REGISTER_CANDIDAT} className="text-sm text-[#226D68] hover:underline">
                Je suis candidat
              </Link>
              <Link to={ROUTES.HOME} className="text-sm text-[#6b7280] hover:underline">
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
