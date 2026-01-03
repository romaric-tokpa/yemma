import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adminApi } from '@/services/api'
import { useState } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { z } from 'zod'

// Schéma de validation pour la grille d'évaluation
const evaluationSchema = z.object({
  overallScore: z.number().min(0).max(5).step(0.1, "La note doit être un multiple de 0.1"),
  softSkills: z.number().min(0).max(5).step(0.1).optional(),
  summary: z.string().min(50, "Le résumé doit contenir au moins 50 caractères"),
})

export default function EvaluationForm({ candidateId, candidateData, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [action, setAction] = useState(null) // 'validate' or 'reject'
  const [error, setError] = useState(null)

  const form = useForm({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      overallScore: 0,
      softSkills: undefined,
      summary: '',
    },
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form
  const overallScore = watch('overallScore')
  const summary = watch('summary')

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const currentAction = data.action || action
      
      if (currentAction === 'validate') {
        // Appeler l'endpoint Admin Service pour valider
        await adminApi.validateProfile(candidateId, {
          overallScore: data.overallScore,
          softSkills: data.softSkills,
          summary: data.summary,
        })
        
        alert('Profil validé avec succès ! L\'indexation dans ElasticSearch est en cours.')
        if (onSuccess) {
          onSuccess()
        }
      } else if (currentAction === 'reject') {
        // Pour le rejet, on utilise le résumé comme motif de rejet
        await adminApi.rejectProfile(candidateId, {
          rejectionReason: data.summary || 'Non spécifié',
          overallScore: data.overallScore || null,
        })
        
        alert('Profil rejeté avec succès.')
        if (onSuccess) {
          onSuccess()
        }
      }
      
      // Reset form
      form.reset()
      setAction(null)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setError(error.response?.data?.detail || error.message || 'Erreur lors de la soumission')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Note Globale */}
      <div className="space-y-2">
        <Label htmlFor="overallScore">
          Note Globale <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-4">
          <Input
            id="overallScore"
            type="number"
            min="0"
            max="5"
            step="0.1"
            className="w-32"
            {...register('overallScore', { valueAsNumber: true })}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(overallScore / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">/5</span>
            </div>
          </div>
        </div>
        {errors.overallScore && (
          <p className="text-sm text-destructive">{errors.overallScore.message}</p>
        )}
      </div>

      {/* Soft Skills */}
      <div className="space-y-2">
        <Label htmlFor="softSkills">Soft Skills (optionnel)</Label>
        <div className="flex items-center gap-4">
          <Input
            id="softSkills"
            type="number"
            min="0"
            max="5"
            step="0.1"
            className="w-32"
            {...register('softSkills', { valueAsNumber: true })}
          />
          <span className="text-sm text-muted-foreground">/5</span>
        </div>
        {errors.softSkills && (
          <p className="text-sm text-destructive">{errors.softSkills.message}</p>
        )}
      </div>

      {/* Résumé de l'évaluation */}
      <div className="space-y-2">
        <Label htmlFor="summary">
          Résumé de l'évaluation <span className="text-destructive">*</span>
          <span className="text-xs text-muted-foreground ml-2">
            (minimum 50 caractères)
          </span>
        </Label>
        <Textarea
          id="summary"
          rows={6}
          placeholder="Rédigez un résumé détaillé de l'évaluation du candidat (minimum 50 caractères)..."
          {...register('summary')}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <div>
            {errors.summary && (
              <p className="text-sm text-destructive">{errors.summary.message}</p>
            )}
          </div>
          <p className={`text-xs ${
            (summary?.length || 0) < 50 
              ? 'text-muted-foreground' 
              : 'text-green-600'
          }`}>
            {summary?.length || 0} / 50 caractères minimum
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setAction(null)
            form.reset()
            setError(null)
          }}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={async () => {
            setAction('reject')
            const isValid = await form.trigger()
            if (isValid) {
              const formData = form.getValues()
              await onSubmit({ ...formData, action: 'reject' })
            }
          }}
          disabled={isSubmitting}
        >
          {isSubmitting && action === 'reject' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Rejet en cours...
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Rejeter
            </>
          )}
        </Button>
        <Button
          type="submit"
          onClick={() => setAction('validate')}
          disabled={isSubmitting || !overallScore || (summary?.length || 0) < 50}
        >
          {isSubmitting && action === 'validate' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validation en cours...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              VALIDER
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

