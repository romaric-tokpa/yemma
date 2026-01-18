import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adminApi, candidateApi } from '@/services/api'
import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, XCircle, History } from 'lucide-react'
import { z } from 'zod'

// Schéma de validation pour la grille d'évaluation
const evaluationSchema = z.object({
  overallScore: z.number().min(0).max(5).step(0.1, "La note doit être un multiple de 0.1"),
  technicalSkills: z.number().min(0).max(5).step(0.1).optional(),
  softSkills: z.number().min(0).max(5).step(0.1).optional(),
  communication: z.number().min(0).max(5).step(0.1).optional(),
  motivation: z.number().min(0).max(5).step(0.1).optional(),
  summary: z.string().min(50, "Le résumé doit contenir au moins 50 caractères"),
})

export default function EvaluationForm({ candidateId, candidateData, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [action, setAction] = useState(null) // 'validate' or 'reject'
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [evaluationHistory, setEvaluationHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const form = useForm({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      overallScore: 0,
      technicalSkills: undefined,
      softSkills: undefined,
      communication: undefined,
      motivation: undefined,
      summary: '',
    },
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = form
  const overallScore = watch('overallScore')
  const summary = watch('summary')

  // Charger les évaluations existantes au montage
  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        setLoading(true)
        // Essayer de charger l'évaluation depuis admin_report (même si non validé)
        const adminReport = candidateData?.admin_report
        if (adminReport) {
          // Charger les données existantes
          reset({
            overallScore: adminReport.overall_score || 0,
            technicalSkills: adminReport.technical_skills_rating,
            softSkills: adminReport.soft_skills_rating,
            communication: adminReport.communication_rating,
            motivation: adminReport.motivation_rating,
            summary: adminReport.summary || '',
          })
          
          // Charger l'historique si disponible
          if (adminReport.evaluation_history && Array.isArray(adminReport.evaluation_history)) {
            setEvaluationHistory(adminReport.evaluation_history)
          }
        } else {
          // Si pas d'évaluation, essayer via l'endpoint admin
          try {
            const evalData = await adminApi.getCandidateEvaluation(candidateId)
            if (evalData) {
              reset({
                overallScore: evalData.overall_score || 0,
                technicalSkills: evalData.technical_skills_rating,
                softSkills: evalData.soft_skills_rating,
                communication: evalData.communication_rating,
                motivation: evalData.motivation_rating,
                summary: evalData.summary || '',
              })
            }
          } catch (err) {
            // Pas d'évaluation existante, c'est normal pour un nouveau profil
            console.log('Aucune évaluation existante pour ce candidat')
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement de l\'évaluation:', err)
      } finally {
        setLoading(false)
      }
    }

    if (candidateId) {
      loadEvaluation()
    }
  }, [candidateId, candidateData?.admin_report])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const currentAction = data.action || action
      
      if (currentAction === 'validate') {
        // Appeler l'endpoint Admin Service pour valider
        const response = await adminApi.validateProfile(candidateId, {
          overallScore: data.overallScore,
          technicalSkills: data.technicalSkills,
          softSkills: data.softSkills,
          communication: data.communication,
          motivation: data.motivation,
          summary: data.summary,
        })
        
        // Le statut est maintenant mis à jour de façon synchrone
        // Attendre un peu pour laisser le temps à la réponse d'arriver
        if (onSuccess) {
          await onSuccess()
        }
      } else if (currentAction === 'reject') {
        // Pour le rejet, on utilise le résumé comme motif de rejet
        const response = await adminApi.rejectProfile(candidateId, {
          rejectionReason: data.summary || 'Non spécifié',
          overallScore: data.overallScore || null,
        })
        
        // Le statut est maintenant mis à jour de façon synchrone
        // Attendre un peu pour laisser le temps à la réponse d'arriver
        if (onSuccess) {
          await onSuccess()
        }
      }
      
      // Recharger les données pour mettre à jour l'historique
      // Attendre un court délai pour laisser le backend traiter
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Recharger les données d'évaluation pour obtenir l'historique mis à jour
      try {
        const adminReport = candidateData?.admin_report
        if (adminReport && adminReport.evaluation_history) {
          setEvaluationHistory(adminReport.evaluation_history)
        } else {
          // Essayer de recharger depuis le profil
          const profile = await candidateApi.getProfile(candidateId)
          if (profile?.admin_report?.evaluation_history) {
            setEvaluationHistory(profile.admin_report.evaluation_history)
            // Mettre à jour les valeurs du formulaire avec les dernières données
            const latest = profile.admin_report.evaluation_history[0]
            if (latest) {
              reset({
                overallScore: latest.overall_score || data.overallScore || 0,
                technicalSkills: latest.technical_skills_rating || data.technicalSkills,
                softSkills: latest.soft_skills_rating || data.softSkills,
                communication: latest.communication_rating || data.communication,
                motivation: latest.motivation_rating || data.motivation,
                summary: latest.summary || data.summary || '',
              })
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors du rechargement de l\'historique:', err)
      }
      
      // Ne pas reset le form, garder les données pour référence
      setAction(null)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setError(error.response?.data?.detail || error.message || 'Erreur lors de la soumission')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Chargement de l'évaluation...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Historique des évaluations */}
      {evaluationHistory.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 mb-2"
          >
            <History className="w-4 h-4" />
            Historique des évaluations ({evaluationHistory.length})
          </Button>
          {showHistory && (
            <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
              {evaluationHistory.map((entry, index) => (
                <div key={index} className="border rounded p-3 bg-background text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-xs text-muted-foreground">
                      {entry.updated_at ? new Date(entry.updated_at).toLocaleString('fr-FR') : 'Date inconnue'}
                    </span>
                    {entry.status && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        entry.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                        entry.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.status}
                      </span>
                    )}
                  </div>
                  {entry.overall_score !== undefined && (
                    <div className="mb-1">
                      <span className="text-muted-foreground">Note globale: </span>
                      <span className="font-medium">{entry.overall_score}/5</span>
                    </div>
                  )}
                  {entry.summary && (
                    <div className="mt-2 text-muted-foreground">
                      <span className="font-medium">Résumé: </span>
                      <span>{entry.summary}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Compétences Techniques */}
      <div className="space-y-2">
        <Label htmlFor="technicalSkills">Compétences techniques</Label>
        <div className="flex items-center gap-4">
          <Input
            id="technicalSkills"
            type="number"
            min="0"
            max="5"
            step="0.1"
            className="w-32"
            {...register('technicalSkills', { valueAsNumber: true })}
          />
          <span className="text-sm text-muted-foreground">/5</span>
        </div>
        {errors.technicalSkills && (
          <p className="text-sm text-destructive">{errors.technicalSkills.message}</p>
        )}
      </div>

      {/* Soft Skills */}
      <div className="space-y-2">
        <Label htmlFor="softSkills">Compétences comportementales</Label>
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

      {/* Communication */}
      <div className="space-y-2">
        <Label htmlFor="communication">Communication</Label>
        <div className="flex items-center gap-4">
          <Input
            id="communication"
            type="number"
            min="0"
            max="5"
            step="0.1"
            className="w-32"
            {...register('communication', { valueAsNumber: true })}
          />
          <span className="text-sm text-muted-foreground">/5</span>
        </div>
        {errors.communication && (
          <p className="text-sm text-destructive">{errors.communication.message}</p>
        )}
      </div>

      {/* Motivation */}
      <div className="space-y-2">
        <Label htmlFor="motivation">Motivation</Label>
        <div className="flex items-center gap-4">
          <Input
            id="motivation"
            type="number"
            min="0"
            max="5"
            step="0.1"
            className="w-32"
            {...register('motivation', { valueAsNumber: true })}
          />
          <span className="text-sm text-muted-foreground">/5</span>
        </div>
        {errors.motivation && (
          <p className="text-sm text-destructive">{errors.motivation.message}</p>
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
    </div>
  )
}

