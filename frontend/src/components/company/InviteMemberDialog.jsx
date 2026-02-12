import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Mail, UserPlus, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { companyApi } from '../../services/api'

const inviteSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom est trop long'),
  last_name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  email: z.string().email('Email invalide').min(1, 'L\'email est requis'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

export function InviteMemberDialog({ open, onOpenChange, companyId, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(inviteSchema),
  })

  const handleClose = () => {
    if (!loading) {
      reset()
      setSuccess(false)
      setError(null)
      onOpenChange(false)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      await companyApi.inviteMember(companyId, {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
      })
      setSuccess(true)
      reset()
      
      // Attendre 2 secondes avant de fermer et appeler onSuccess
      setTimeout(() => {
        handleClose()
        if (onSuccess) onSuccess()
      }, 2000)
    } catch (error) {
      console.error('Error inviting member:', error)
      // Extraire le message d'erreur détaillé
      let errorMessage = 'Erreur lors de la création du compte'
      if (error.response?.data) {
        const responseData = error.response.data
        if (responseData.detail) {
          errorMessage = typeof responseData.detail === 'string' 
            ? responseData.detail 
            : JSON.stringify(responseData.detail)
        } else if (responseData.message) {
          errorMessage = responseData.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-lg shadow-xl max-w-md p-5">
        <DialogHeader className="pb-3 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E8F4F3] flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-[#226D68]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-[#2C2C2C] font-[Poppins]">
                Inviter un collaborateur
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-[#9ca3af]">
                Créez un compte recruteur. Un email sera envoyé pour définir le mot de passe.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-[#E8F4F3] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-6 w-6 text-[#226D68]" />
            </div>
            <h3 className="text-sm font-semibold text-[#2C2C2C] mb-1">Compte créé !</h3>
            <p className="text-xs text-[#9ca3af]">
              Un email avec lien de réinitialisation a été envoyé (valable 24h).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-xs font-medium text-[#2C2C2C]">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="Jean"
                  {...register('first_name')}
                  className={errors.first_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  disabled={loading}
                />
                {errors.first_name && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-xs font-medium text-[#2C2C2C]">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Dupont"
                  {...register('last_name')}
                  className={errors.last_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  disabled={loading}
                />
                {errors.last_name && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-[#2C2C2C]">
                Adresse email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="collaborateur@example.com"
                  {...register('email')}
                  className={`pl-10 rounded-md ${
                    errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-0.5">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-[#2C2C2C]">
                Mot de passe temporaire <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-0.5">{errors.password.message}</p>
              )}
              <p className="text-[10px] text-[#9ca3af] mt-1">
                Mot de passe temporaire. Le collaborateur recevra un email pour le personnaliser.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={loading}
                className="h-8 text-xs border-[#d1d5db] text-[#2C2C2C]"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="h-8 text-xs bg-[#226D68] hover:bg-[#1a5a55]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Créer le compte
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
