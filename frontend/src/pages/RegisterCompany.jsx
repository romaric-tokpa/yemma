import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
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
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
        <Card className="w-full max-w-[380px] rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 text-white text-center bg-gradient-to-r from-[#e76f51] to-[#d45a3f]">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-white/90" />
            <h2 className="text-lg font-bold text-white mb-1">Inscription réussie</h2>
            <p className="text-xs text-white/80">
              Redirection vers la configuration de votre entreprise...
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <Card className="rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#e76f51] to-[#d45a3f]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white">Inscription Entreprise</CardTitle>
                <CardDescription className="text-white/90 text-xs">Accédez à la CVthèque de profils validés</CardDescription>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">{error}</p>
                    {error.includes('existe déjà') && (
                      <Link to="/login" className="text-[10px] text-red-600 hover:underline mt-0.5 block">
                        Se connecter avec cet email →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="firstName" className="text-xs font-medium">Prénom *</Label>
                  <Input id="firstName" {...register('firstName')} disabled={isLoading}
                    className="h-9 text-sm mt-0.5" />
                  {errors.firstName && <p className="text-[10px] text-red-600 mt-0.5">{errors.firstName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-xs font-medium">Nom *</Label>
                  <Input id="lastName" {...register('lastName')} disabled={isLoading}
                    className="h-9 text-sm mt-0.5" />
                  {errors.lastName && <p className="text-[10px] text-red-600 mt-0.5">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-xs font-medium">Email professionnel *</Label>
                <Input id="email" type="email" placeholder="contact@entreprise.com" {...register('email')}
                  disabled={isLoading} className="h-9 text-sm mt-0.5" />
                {errors.email && <p className="text-[10px] text-red-600 mt-0.5">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="companyName" className="text-xs font-medium">Nom entreprise *</Label>
                <Input id="companyName" placeholder="Ex: Acme Corp" {...register('companyName')}
                  disabled={isLoading} className="h-9 text-sm mt-0.5" />
                {errors.companyName && <p className="text-[10px] text-red-600 mt-0.5">{errors.companyName.message}</p>}
              </div>

              <div>
                <Label htmlFor="companyLegalId" className="text-xs font-medium">RCCM *</Label>
                <Input id="companyLegalId" placeholder="CI-ABJ-XX-XXXX-BXX-XXXXX" {...register('companyLegalId')}
                  disabled={isLoading} className="h-9 text-sm mt-0.5" />
                {errors.companyLegalId && <p className="text-[10px] text-red-600 mt-0.5">{errors.companyLegalId.message}</p>}
                <p className="text-[10px] text-[#6b7280] mt-0.5">Numéro RCCM de l&apos;entreprise</p>
              </div>

              <div>
                <Label htmlFor="password" className="text-xs font-medium">Mot de passe *</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register('password')}
                  disabled={isLoading} className="h-9 text-sm mt-0.5" />
                {errors.password && <p className="text-[10px] text-red-600 mt-0.5">{errors.password.message}</p>}
                <p className="text-[10px] text-[#6b7280] mt-0.5">Min. 8 caractères</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirmer *</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')}
                  disabled={isLoading} className="h-9 text-sm mt-0.5" />
                {errors.confirmPassword && <p className="text-[10px] text-red-600 mt-0.5">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" disabled={isLoading}
                className="w-full h-9 bg-[#e76f51] hover:bg-[#d45a3f] text-white text-sm font-semibold">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    Inscription...
                  </span>
                ) : (
                  <>
                    <Building className="w-4 h-4 mr-2" />
                    Créer mon compte entreprise
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[10px] text-[#6b7280] text-center mb-2">Vous avez déjà un compte ?</p>
              <div className="flex gap-2">
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className="w-full h-8 text-xs border-[#e76f51] text-[#e76f51] hover:bg-[#FDF2F0]">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />Se connecter
                  </Button>
                </Link>
                <Link to="/register/candidat" className="flex-1">
                  <Button variant="outline" className="w-full h-8 text-xs border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3]">
                    Candidat
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="text-center mt-4 text-[10px] text-[#6b7280]">
          <Link to="/" className="text-[#226D68] hover:underline">Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  )
}
