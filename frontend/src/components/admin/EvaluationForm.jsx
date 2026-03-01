import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adminApi, candidateApi } from '@/services/api'
import { useState, useEffect, useRef } from 'react'
import { Loader2, CheckCircle2, XCircle, History, MessageSquare, FileText, Scale, Sparkles, Copy, Bot, Upload, AlertCircle } from 'lucide-react'
import { formatDateTime } from '@/utils/dateUtils'
import { getApiErrorDetail } from '@/utils/apiError'
import { z } from 'zod'

const evaluationSchema = z.object({
  overallScore: z.number().min(0).max(5).step(0.5, 'La note doit être un multiple de 0.5'),
  technicalSkills: z.number().min(0).max(5).step(0.5).optional().nullable(),
  softSkills: z.number().min(0).max(5).step(0.5).optional().nullable(),
  communication: z.number().min(0).max(5).step(0.5).optional().nullable(),
  motivation: z.number().min(0).max(5).step(0.5).optional().nullable(),
  summary: z.string().min(50, 'Le résumé doit contenir au moins 50 caractères'),
  interview_notes: z.string().optional(),
  recommendations: z.string().optional(),
})

const SCORE_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
const CRITERIA = [
  { key: 'technicalSkills', label: 'Compétences techniques', short: 'Technique' },
  { key: 'softSkills', label: 'Compétences comportementales', short: 'Soft' },
  { key: 'communication', label: 'Communication', short: 'Com.' },
  { key: 'motivation', label: 'Motivation', short: 'Motiv.' },
]

export default function EvaluationForm({ candidateId, candidateData, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [action, setAction] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [evaluationHistory, setEvaluationHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  // Analyse par IA (CvGPT / Profile Asking HrFlow)
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  // Indexer un CV pour profils sans hrflow_profile_key
  const [indexCvLoading, setIndexCvLoading] = useState(false)
  const [indexCvError, setIndexCvError] = useState(null)
  const [indexCvSuccess, setIndexCvSuccess] = useState(false)
  const indexCvInputRef = useRef(null)

  const hasAiProfile = Boolean(candidateData?.hrflow_profile_key)

  const AI_PRESET_QUESTIONS = [
    {
      label: 'Résumé d\'évaluation',
      question: "Rédige un résumé d'évaluation professionnel pour ce profil en 4-5 phrases : points forts, axes d'amélioration et avis global.",
    },
    {
      label: 'Points forts / axes d\'amélioration',
      question: 'Quels sont les 3 principaux points forts et 2 axes d\'amélioration pour ce candidat ?',
    },
    {
      label: 'Questions d\'entretien',
      question: 'Propose 5 questions d\'entretien pertinentes pour ce profil.',
    },
    {
      label: 'Adéquation poste',
      question: "Synthétise en une phrase l'adéquation du profil pour un poste en entreprise.",
    },
  ]

  const askAi = async (questionText) => {
    const q = (questionText || aiQuestion || '').trim()
    if (!q) return
    setAiError(null)
    setAiAnswer('')
    setAiLoading(true)
    try {
      const data = await adminApi.askProfileQuestion(candidateId, q)
      setAiAnswer(data?.answer ?? '')
    } catch (err) {
      setAiError(getApiErrorDetail(err, "Erreur lors de l'analyse IA."))
      setAiAnswer('')
    } finally {
      setAiLoading(false)
    }
  }

  const insertAiInto = (field) => {
    if (!aiAnswer) return
    const current = form.getValues(field) || ''
    const sep = current.length ? '\n\n' : ''
    setValue(field, current + sep + aiAnswer)
  }

  const form = useForm({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      overallScore: 0,
      technicalSkills: 0,
      softSkills: 0,
      communication: 0,
      motivation: 0,
      summary: '',
      interview_notes: '',
      recommendations: '',
    },
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = form
  const overallScore = watch('overallScore')
  const summary = watch('summary')

  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        setLoading(true)
        const adminReport = candidateData?.admin_report
        if (adminReport) {
          reset({
            overallScore: adminReport.overall_score ?? 0,
            technicalSkills: adminReport.technical_skills_rating ?? 0,
            softSkills: adminReport.soft_skills_rating ?? 0,
            communication: adminReport.communication_rating ?? 0,
            motivation: adminReport.motivation_rating ?? 0,
            summary: adminReport.summary || '',
            interview_notes: adminReport.interview_notes || '',
            recommendations: adminReport.recommendations || '',
          })
          if (adminReport.evaluation_history && Array.isArray(adminReport.evaluation_history)) {
            setEvaluationHistory(adminReport.evaluation_history)
          }
        } else {
          try {
            const evalData = await adminApi.getCandidateEvaluation(candidateId)
            if (evalData) {
              reset({
                overallScore: evalData.overall_score ?? 0,
                technicalSkills: evalData.technical_skills_rating ?? 0,
                softSkills: evalData.soft_skills_rating ?? 0,
                communication: evalData.communication_rating ?? 0,
                motivation: evalData.motivation_rating ?? 0,
                summary: evalData.summary || '',
                interview_notes: evalData.interview_notes || '',
                recommendations: evalData.recommendations || '',
              })
            }
          } catch {
            // Pas d'évaluation existante
          }
        }
      } catch (err) {
        console.error('Erreur chargement évaluation:', err)
      } finally {
        setLoading(false)
      }
    }
    if (candidateId) loadEvaluation()
  }, [candidateId, candidateData?.admin_report, reset])

  const isAlreadyValidated = candidateData?.status === 'VALIDATED'

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setError(null)
    const currentAction = data.action || action
    try {
      if (currentAction === 'validate') {
        if (isAlreadyValidated) {
          await adminApi.updateEvaluation(candidateId, {
            overallScore: data.overallScore,
            technicalSkills: data.technicalSkills ?? null,
            softSkills: data.softSkills ?? null,
            communication: data.communication ?? null,
            motivation: data.motivation ?? null,
            summary: data.summary,
            interview_notes: data.interview_notes || '',
            recommendations: data.recommendations || '',
          })
        } else {
          await adminApi.validateProfile(candidateId, {
            overallScore: data.overallScore,
            technicalSkills: data.technicalSkills ?? null,
            softSkills: data.softSkills ?? null,
            communication: data.communication ?? null,
            motivation: data.motivation ?? null,
            summary: data.summary,
            interview_notes: data.interview_notes || '',
            recommendations: data.recommendations || '',
          })
        }
      } else if (currentAction === 'reject') {
        await adminApi.rejectProfile(candidateId, {
          rejectionReason: data.summary || 'Non spécifié',
          overallScore: data.overallScore ?? null,
          interview_notes: data.interview_notes || '',
        })
      }
      if (onSuccess) await onSuccess()
      setConfirmReject(false)
      setAction(null)
      await new Promise((r) => setTimeout(r, 400))
      const profile = await candidateApi.getProfile(candidateId)
      if (profile?.admin_report?.evaluation_history) {
        setEvaluationHistory(profile.admin_report.evaluation_history)
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la soumission')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#226D68]" />
        <span className="text-sm text-[#6b7280]">Chargement de l&apos;évaluation...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Historique - compact */}
      {evaluationHistory.length > 0 && (
        <details className="group rounded-xl border border-gray-200 bg-[#F9FAFB]/80 overflow-hidden">
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none text-sm font-medium text-[#2C2C2C] hover:bg-[#F4F6F8] transition-colors">
            <History className="h-4 w-4 text-[#226D68]" />
            Historique des évaluations ({evaluationHistory.length})
            <span className="ml-auto inline-block text-xs text-[#6b7280] group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="px-4 pb-4 pt-1 space-y-2 max-h-52 overflow-y-auto">
            {evaluationHistory.map((entry, index) => (
              <div key={index} className="rounded-lg border border-gray-100 bg-white p-3 text-sm">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs text-[#6b7280]">
                    {entry.updated_at ? formatDateTime(entry.updated_at) : '—'}
                  </span>
                  {entry.status && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                        entry.status === 'VALIDATED'
                          ? 'bg-[#226D68]/15 text-[#1a5a55]'
                          : entry.status === 'REJECTED'
                            ? 'bg-[#e76f51]/15 text-[#c04a2f]'
                            : 'bg-gray-100 text-[#6b7280]'
                      }`}
                    >
                      {entry.status}
                    </span>
                  )}
                </div>
                {entry.overall_score != null && (
                  <p className="text-[#2C2C2C] font-medium">
                    Note globale <strong className="text-[#226D68]">{entry.overall_score}/5</strong>
                  </p>
                )}
                {entry.summary && (
                  <p className="text-[#6b7280] mt-1 line-clamp-2 text-xs">{entry.summary}</p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Critères d'évaluation */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-[#F9FAFB] flex items-center gap-2">
            <Scale className="h-4 w-4 text-[#226D68]" strokeWidth={2} />
            <span className="text-sm font-semibold text-[#2C2C2C]">Critères d&apos;évaluation</span>
          </div>
          <div className="p-4 sm:p-5 space-y-5">
            {/* Note globale - mise en avant */}
            <div className="rounded-xl bg-gradient-to-br from-[#226D68]/5 to-[#226D68]/10 p-4 sm:p-5 border border-[#226D68]/10">
              <Label htmlFor="overallScore" className="text-sm font-semibold text-[#2C2C2C]">
                Note globale <span className="text-[#e76f51]">*</span>
              </Label>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex gap-0.5" role="group" aria-label="Note sur 5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setValue('overallScore', star)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
                        overallScore >= star
                          ? 'bg-[#226D68] text-white shadow-sm'
                          : 'bg-white/80 text-gray-300 hover:bg-[#226D68]/10 hover:text-[#226D68] border border-gray-200'
                      }`}
                    >
                      {star}
                    </button>
                  ))}
                </div>
                <span className="text-2xl font-bold text-[#226D68] tabular-nums">{overallScore}/5</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {SCORE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue('overallScore', s)}
                    className={`min-w-[2.25rem] h-8 rounded-lg text-xs font-medium transition-all ${
                      overallScore === s
                        ? 'bg-[#226D68] text-white ring-2 ring-[#226D68]/30'
                        : 'bg-white text-[#6b7280] hover:bg-[#226D68]/10 hover:text-[#1a5a55] border border-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.overallScore && (
                <p className="text-xs text-red-600 mt-2">{errors.overallScore.message}</p>
              )}
            </div>

            {/* 4 critères en grille 2x2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CRITERIA.map(({ key, label }) => (
                <div key={key} className="rounded-lg border border-gray-100 bg-[#F9FAFB]/50 p-3">
                  <Label className="text-xs font-medium text-[#6b7280]">{label}</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      className="flex-1 h-2 rounded-full appearance-none bg-gray-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#226D68] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm accent-[#226D68]"
                      {...register(key, { valueAsNumber: true })}
                    />
                    <span className="w-10 text-right text-sm font-semibold text-[#2C2C2C] tabular-nums">{watch(key) ?? '—'}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Synthèse */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-[#F9FAFB] flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#226D68]" strokeWidth={2} />
            <span className="text-sm font-semibold text-[#2C2C2C]">Synthèse & analyse</span>
          </div>
          <div className="p-4 sm:p-5 space-y-4">
            {/* Analyse par IA (CvGPT / Profile Asking HrFlow) */}
            <div className="rounded-xl border border-[#226D68]/20 bg-gradient-to-br from-[#226D68]/5 to-transparent p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2C2C2C]">
                <Sparkles className="h-4 w-4 text-[#226D68]" strokeWidth={2} />
                <span>Analyse par IA (CvGPT)</span>
              </div>
              {!hasAiProfile ? (
                <div className="space-y-3">
                  <p className="text-xs text-[#6b7280]">
                    L&apos;analyse IA n&apos;est pas disponible pour ce profil (créé sans CV ou sans indexation HrFlow).
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={indexCvInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        setIndexCvError(null)
                        setIndexCvSuccess(false)
                        setIndexCvLoading(true)
                        try {
                          await adminApi.indexCvForCandidate(candidateId, f)
                          setIndexCvSuccess(true)
                          onSuccess?.()
                        } catch (err) {
                          setIndexCvError(err?.response?.data?.detail || err?.message || 'Erreur lors de l\'indexation.')
                        } finally {
                          setIndexCvLoading(false)
                          e.target.value = ''
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={indexCvLoading}
                      onClick={() => indexCvInputRef.current?.click()}
                    >
                      {indexCvLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                      {indexCvLoading ? 'Indexation…' : 'Indexer un CV (PDF/DOCX)'}
                    </Button>
                  </div>
                  {indexCvSuccess && <p className="text-xs text-emerald-600">CV indexé. L&apos;analyse IA est maintenant disponible.</p>}
                  {indexCvError && <p className="text-xs text-destructive">{indexCvError}</p>}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_PRESET_QUESTIONS.map(({ label, question }) => (
                      <Button
                        key={label}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 border-[#226D68]/40 text-[#2C2C2C] hover:bg-[#226D68]/10 hover:border-[#226D68]/60"
                        disabled={aiLoading}
                        onClick={() => {
                          setAiQuestion(question)
                          askAi(question)
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ou posez une question en langage naturel sur le profil..."
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      rows={2}
                      className="resize-none text-sm border-gray-200 rounded-lg flex-1 focus:ring-2 focus:ring-[#226D68]/30 focus:border-[#226D68]"
                      disabled={aiLoading}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#226D68] hover:bg-[#1a5a55] text-white shrink-0"
                      disabled={aiLoading || !aiQuestion.trim()}
                      onClick={() => askAi()}
                    >
                      {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                      {aiLoading ? 'Analyse...' : 'Poser'}
                    </Button>
                  </div>
                  {aiError && (
                    <p className="text-xs text-destructive">{aiError}</p>
                  )}
                  {aiAnswer && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[#6b7280]">Réponse IA :</p>
                      <div className="rounded-lg bg-white border border-gray-200 p-3 text-sm text-[#2C2C2C] whitespace-pre-wrap">
                        {aiAnswer}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 border-[#226D68]/30 text-[#1a5a55] hover:bg-[#226D68]/10"
                          onClick={() => insertAiInto('summary')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Insérer dans le résumé
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 border-[#226D68]/30 text-[#1a5a55] hover:bg-[#226D68]/10"
                          onClick={() => insertAiInto('interview_notes')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Notes d&apos;entretien
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 border-[#226D68]/30 text-[#1a5a55] hover:bg-[#226D68]/10"
                          onClick={() => insertAiInto('recommendations')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Recommandations
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <Label htmlFor="summary" className="text-sm font-medium text-[#2C2C2C]">
                Résumé de l&apos;évaluation <span className="text-[#e76f51]">*</span>
              </Label>
              <Textarea
                id="summary"
                rows={4}
                placeholder="Synthétisez les points forts, les axes d'amélioration et votre avis global (min. 50 caractères)."
                className="mt-2 resize-none text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-[#226D68]/30 focus:border-[#226D68]"
                {...register('summary')}
              />
              <div className="flex justify-between items-center mt-1.5">
                {errors.summary && (
                  <p className="text-xs text-red-600">{errors.summary.message}</p>
                )}
                <p className={`text-xs ml-auto font-medium ${(summary?.length || 0) >= 50 ? 'text-[#226D68]' : 'text-[#6b7280]'}`}>
                  {summary?.length || 0} / 50 min.
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="interview_notes" className="text-sm font-medium text-[#2C2C2C] flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-[#226D68]" />
                Notes d&apos;entretien (optionnel)
              </Label>
              <Textarea
                id="interview_notes"
                rows={2}
                placeholder="Points notés en entretien..."
                className="mt-2 resize-none text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-[#226D68]/30 focus:border-[#226D68]"
                {...register('interview_notes')}
              />
            </div>
            <div>
              <Label htmlFor="recommendations" className="text-sm font-medium text-[#2C2C2C]">
                Recommandations (optionnel)
              </Label>
              <Textarea
                id="recommendations"
                rows={2}
                placeholder="Recommandations pour le poste ou la suite du processus..."
                className="mt-2 resize-none text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-[#226D68]/30 focus:border-[#226D68]"
                {...register('recommendations')}
              />
            </div>
          </div>
        </div>

        {/* Décision */}
        <div className="pt-6 mt-6 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAction(null)
                setConfirmReject(false)
                setError(null)
              }}
              disabled={isSubmitting}
              className="text-[#6b7280] hover:text-[#226D68] hover:bg-[#E8F4F3]"
            >
              Réinitialiser
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              {!confirmReject ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmReject(true)}
                  disabled={isSubmitting || (summary?.length || 0) < 50}
                  className="h-10 px-4 border-[#e76f51]/50 text-[#e76f51] hover:bg-[#e76f51]/10 hover:border-[#e76f51]"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
              ) : (
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmReject(false)} disabled={isSubmitting} className="h-10">
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      setAction('reject')
                      const valid = await form.trigger()
                      if (valid) await onSubmit({ ...form.getValues(), action: 'reject' })
                    }}
                    disabled={isSubmitting || (summary?.length || 0) < 50}
                    className="h-10 px-4"
                  >
                    {isSubmitting && action === 'reject' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Confirmer le rejet
                  </Button>
                </>
              )}
              <Button
                type="submit"
                size="sm"
                onClick={() => setAction('validate')}
                disabled={isSubmitting || (summary?.length || 0) < 50 || overallScore == null}
                className="h-10 px-5 bg-[#226D68] hover:bg-[#1a5a55] text-white font-medium shadow-sm"
              >
                {isSubmitting && action === 'validate' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" /> 
                )}
                {isAlreadyValidated ? 'Mettre à jour' : 'Valider le profil'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
