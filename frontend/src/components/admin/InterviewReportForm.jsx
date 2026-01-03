import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adminApi } from '@/services/api'
import { interviewReportSchema } from '@/schemas/admin'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function InterviewReportForm({ candidateId, candidateData }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [action, setAction] = useState(null) // 'validate' or 'reject'

  const form = useForm({
    resolver: zodResolver(interviewReportSchema),
    defaultValues: {
      overallScore: 0,
      technicalSkills: 0,
      softSkills: 0,
      communication: 0,
      motivation: 0,
      softSkillsTags: [],
      summary: '',
      rejectionReason: '',
    },
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form
  const overallScore = watch('overallScore')

  const onSubmit = async (data) => {
    if (action === 'reject' && !data.rejectionReason) {
      form.setError('rejectionReason', {
        type: 'manual',
        message: 'Le motif de rejet est requis',
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (action === 'validate') {
        await adminApi.validateProfile(candidateId, {
          ...data,
          status: 'VALIDATED',
        })
        alert('Profil validé avec succès !')
      } else if (action === 'reject') {
        await adminApi.rejectProfile(candidateId, {
          ...data,
          status: 'REJECTED',
        })
        alert('Profil rejeté avec succès.')
      }
      // Reset form
      form.reset()
      setAction(null)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      alert('Erreur lors de la soumission du compte rendu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Notes */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label htmlFor="overallScore">Note Globale *</Label>
          <Input
            id="overallScore"
            type="number"
            min="0"
            max="5"
            step="0.5"
            {...register('overallScore', { valueAsNumber: true })}
          />
          {errors.overallScore && (
            <p className="text-sm text-destructive">{errors.overallScore.message}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(overallScore / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">/5</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="technicalSkills">Compétences Techniques</Label>
          <Input
            id="technicalSkills"
            type="number"
            min="0"
            max="5"
            step="0.5"
            {...register('technicalSkills', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="softSkills">Soft Skills</Label>
          <Input
            id="softSkills"
            type="number"
            min="0"
            max="5"
            step="0.5"
            {...register('softSkills', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="communication">Communication</Label>
          <Input
            id="communication"
            type="number"
            min="0"
            max="5"
            step="0.5"
            {...register('communication', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivation">Motivation</Label>
          <Input
            id="motivation"
            type="number"
            min="0"
            max="5"
            step="0.5"
            {...register('motivation', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Soft Skills Tags */}
      <div className="space-y-2">
        <Label>Soft Skills (Tags)</Label>
        <div className="flex flex-wrap gap-2">
          {['Communication', 'Leadership', 'Rigueur', 'Autonomie', 'Esprit d\'équipe', 'Créativité', 'Adaptabilité'].map((skill) => {
            const isSelected = watch('softSkillsTags')?.includes(skill)
            return (
              <button
                key={skill}
                type="button"
                onClick={() => {
                  const current = watch('softSkillsTags') || []
                  const updated = isSelected
                    ? current.filter(s => s !== skill)
                    : [...current, skill]
                  setValue('softSkillsTags', updated)
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                }`}
              >
                {skill}
              </button>
            )
          })}
        </div>
      </div>

      {/* Résumé */}
      <div className="space-y-2">
        <Label htmlFor="summary">Résumé de l'entretien *</Label>
        <Textarea
          id="summary"
          rows={6}
          placeholder="Rédigez un compte rendu détaillé de l'entretien..."
          {...register('summary')}
        />
        {errors.summary && (
          <p className="text-sm text-destructive">{errors.summary.message}</p>
        )}
      </div>

      {/* Motif de rejet (affiché seulement si on clique sur Rejeter) */}
      {action === 'reject' && (
        <div className="space-y-2 border border-destructive rounded-lg p-4 bg-destructive/5">
          <Label htmlFor="rejectionReason" className="text-destructive">
            Motif de rejet *
          </Label>
          <Textarea
            id="rejectionReason"
            rows={3}
            placeholder="Expliquez les raisons du rejet..."
            {...register('rejectionReason')}
          />
          {errors.rejectionReason && (
            <p className="text-sm text-destructive">{errors.rejectionReason.message}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setAction(null)
            form.reset()
          }}
        >
          Annuler
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            setAction('reject')
          }}
          disabled={isSubmitting}
        >
          {isSubmitting && action === 'reject' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Rejet en cours...
            </>
          ) : (
            'Rejeter avec motif'
          )}
        </Button>
        <Button
          type="submit"
          onClick={() => setAction('validate')}
          disabled={isSubmitting}
        >
          {isSubmitting && action === 'validate' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validation en cours...
            </>
          ) : (
            'Valider le profil'
          )}
        </Button>
      </div>
    </form>
  )
}

