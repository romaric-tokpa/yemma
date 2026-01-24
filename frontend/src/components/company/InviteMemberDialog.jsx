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
      <DialogContent className="rounded-[12px] shadow-xl max-w-md">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#226D68]/10 rounded-lg">
              <UserPlus className="h-6 w-6 text-[#226D68]" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-anthracite font-heading">
                Inviter un collaborateur
              </DialogTitle>
              <DialogDescription className="mt-1 text-muted-foreground">
                Créez un compte recruteur pour un nouveau membre de l'équipe. Un email lui sera envoyé pour définir son mot de passe.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#226D68]/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[#226D68]" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-anthracite mb-2">
              Compte créé avec succès !
            </h3>
            <p className="text-sm text-muted-foreground">
              Le compte recruteur a été créé. Un email avec un lien de réinitialisation de mot de passe a été envoyé. Le lien est valable pendant 24 heures.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-sm font-medium text-gray-anthracite">
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
                  <p className="text-sm text-red-500 mt-1">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-sm font-medium text-gray-anthracite">
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
                  <p className="text-sm text-red-500 mt-1">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-anthracite">
                Adresse email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-anthracite">
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
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Un mot de passe temporaire sera utilisé pour créer le compte. Le collaborateur recevra un email avec un lien pour définir son propre mot de passe.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="border-blue-deep text-blue-deep hover:bg-blue-deep/10"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
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
