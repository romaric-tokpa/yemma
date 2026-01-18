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
  email: z.string().email('Email invalide').min(1, 'L\'email est requis'),
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
      await companyApi.inviteMember(companyId, data.email)
      setSuccess(true)
      reset()
      
      // Attendre 1.5 secondes avant de fermer et appeler onSuccess
      setTimeout(() => {
        handleClose()
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (error) {
      console.error('Error inviting member:', error)
      setError(error.response?.data?.detail || 'Erreur lors de l\'envoi de l\'invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-[12px] shadow-xl max-w-md">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-emerald/10 rounded-lg">
              <UserPlus className="h-6 w-6 text-green-emerald" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-anthracite font-heading">
                Inviter un collaborateur
              </DialogTitle>
              <DialogDescription className="mt-1 text-muted-foreground">
                Envoyez une invitation par email à un nouveau membre de l'équipe
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-emerald/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-emerald" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-anthracite mb-2">
              Invitation envoyée avec succès !
            </h3>
            <p className="text-sm text-muted-foreground">
              Le collaborateur recevra un email avec un lien d'inscription valable pendant 48 heures.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

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
              <p className="text-xs text-muted-foreground mt-2">
                Le collaborateur recevra un email avec un lien d'inscription valable pendant 48 heures.
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
                className="bg-green-emerald hover:bg-green-emerald/90 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer l'invitation
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
