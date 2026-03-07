/**
 * Grille d'évaluation candidat — charte graphique Yemma Solutions
 * Intégré au backend et à la base de données (admin_report)
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { adminApi } from '@/services/api'
import { Loader2, AlertCircle, History, Sparkles, Copy, Bot, Upload, Settings, FileText, Users, Target, TrendingUp, BarChart3, CheckCircle2, Clock, XCircle, ChevronDown, Printer } from 'lucide-react'
import { formatDateTime } from '@/utils/dateUtils'
import { getApiErrorDetail } from '@/utils/apiError'

// Charte graphique Yemma Solutions
const CHARTE = {
  primary: '#226D68',      // Vert principal (green-emerald)
  primaryLight: '#E8F4F3', // Vert clair
  secondary: '#e76f51',    // Orange secondaire
  text: '#2C2C2C',        // Gris anthracite
  textMuted: '#6b7280',
  bg: '#F4F6F8',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
}

const RATING_LABELS = {
  1: { label: 'Insuffisant', color: CHARTE.danger, desc: 'Ne répond pas aux exigences minimales' },
  2: { label: 'À développer', color: CHARTE.warning, desc: 'En dessous des attentes, potentiel à confirmer' },
  3: { label: 'Satisfaisant', color: '#3B82F6', desc: 'Répond aux attentes du poste' },
  4: { label: 'Bon', color: CHARTE.primary, desc: 'Dépasse les attentes sur plusieurs points' },
  5: { label: 'Excellent', color: CHARTE.success, desc: 'Performance exceptionnelle, profil différenciant' },
}

const CRITERIA = [
  {
    category: 'Compétences Techniques',
    Icon: Settings,
    weight: 30,
    items: [
      { id: 'tech_1', label: "Maîtrise des compétences clés du poste", hint: "Évaluer l'adéquation entre les compétences déclarées et les exigences techniques du poste" },
      { id: 'tech_2', label: 'Capacité de résolution de problèmes', hint: 'Aptitude à analyser un problème complexe et proposer des solutions structurées' },
      { id: 'tech_3', label: "Connaissance de l'environnement sectoriel", hint: "Compréhension du secteur d'activité, de ses enjeux et tendances" },
      { id: 'tech_4', label: 'Outils & méthodologies', hint: 'Maîtrise des outils, logiciels et méthodologies pertinents pour le poste' },
    ],
  },
  {
    category: 'Expérience & Parcours',
    Icon: FileText,
    weight: 25,
    items: [
      { id: 'exp_1', label: "Pertinence de l'expérience professionnelle", hint: 'Cohérence du parcours avec les responsabilités du poste visé' },
      { id: 'exp_2', label: 'Réalisations concrètes et résultats', hint: "Capacité à quantifier ses réussites et démontrer un impact mesurable" },
      { id: 'exp_3', label: 'Progression de carrière', hint: 'Évolution professionnelle cohérente, prise de responsabilités croissantes' },
    ],
  },
  {
    category: 'Compétences Comportementales',
    Icon: Users,
    weight: 20,
    items: [
      { id: 'soft_1', label: 'Communication & clarté d\'expression', hint: 'Capacité à articuler ses idées de manière claire, structurée et convaincante' },
      { id: 'soft_2', label: 'Esprit d\'équipe & collaboration', hint: 'Aptitude à travailler en équipe, à écouter et à contribuer positivement' },
      { id: 'soft_3', label: 'Leadership & prise d\'initiative', hint: 'Capacité à prendre des décisions, à mobiliser et à proposer des solutions' },
      { id: 'soft_4', label: 'Adaptabilité & gestion du stress', hint: 'Résilience face au changement, gestion de la pression et flexibilité' },
    ],
  },
  {
    category: 'Motivation & Adéquation',
    Icon: Target,
    weight: 15,
    items: [
      { id: 'mot_1', label: 'Motivation pour le poste', hint: 'Intérêt sincère pour le rôle, compréhension des missions et des défis' },
      { id: 'mot_2', label: 'Adéquation culturelle avec l\'entreprise', hint: 'Alignement des valeurs du candidat avec la culture de l\'entreprise cliente' },
      { id: 'mot_3', label: 'Projet professionnel cohérent', hint: 'Vision claire de son évolution et cohérence avec l\'opportunité proposée' },
    ],
  },
  {
    category: 'Potentiel & Évolution',
    Icon: TrendingUp,
    weight: 10,
    items: [
      { id: 'pot_1', label: "Capacité d'apprentissage", hint: 'Curiosité intellectuelle, aptitude à monter en compétences rapidement' },
      { id: 'pot_2', label: "Potentiel d'évolution à moyen terme", hint: 'Capacité à prendre des responsabilités élargies dans les 2-3 ans' },
    ],
  },
]

const DECISIONS = [
  { value: 'retenu', label: 'Retenu', color: CHARTE.success, Icon: CheckCircle2 },
  { value: 'reserve', label: 'En réserve', color: CHARTE.warning, Icon: Clock },
  { value: 'non_retenu', label: 'Non retenu', color: CHARTE.danger, Icon: XCircle },
]

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= (hover || value)
        const ratingInfo = RATING_LABELS[hover || value]
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star === value ? 0 : star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="w-8 h-8 min-w-[2rem] min-h-[2rem] shrink-0 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{
              background: active ? (ratingInfo?.color || CHARTE.border) : CHARTE.bg,
              color: active ? 'white' : CHARTE.textMuted,
              transform: active ? 'scale(1.05)' : 'scale(1)',
              transformOrigin: 'center',
              transition: 'background-color 0.15s, color 0.15s, transform 0.15s',
            }}
          >
            {star}
          </button>
        )
      })}
      {/* Zone fixe pour éviter le flickering : espace réservé, pas de changement de dimensions au hover */}
      <span
        className="ml-2 min-w-[7rem] text-xs font-semibold whitespace-nowrap transition-opacity duration-150"
        style={{
          color: (hover || value) > 0 ? RATING_LABELS[hover || value]?.color : 'transparent',
          opacity: (hover || value) > 0 ? 1 : 0,
        }}
        aria-hidden
      >
        {(hover || value) > 0 ? RATING_LABELS[hover || value]?.label : '\u00A0'}
      </span>
    </div>
  )
}

function ScoreGauge({ score, maxScore }) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
  let color = CHARTE.danger
  if (percentage >= 80) color = CHARTE.success
  else if (percentage >= 60) color = CHARTE.primary
  else if (percentage >= 40) color = '#3B82F6'
  else if (percentage >= 20) color = CHARTE.warning

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
        <div className="h-full rounded transition-all duration-500" style={{ width: `${percentage}%`, background: color }} />
      </div>
      <span className="text-sm font-bold min-w-[55px] text-right" style={{ color }}>{score.toFixed(1)}/{maxScore}</span>
    </div>
  )
}

const AI_PRESET_QUESTIONS = [
  { label: "Résumé d'évaluation", question: "Rédige un résumé d'évaluation professionnel pour ce profil en 4-5 phrases : points forts, axes d'amélioration et avis global." },
  { label: "Points forts / axes d'amélioration", question: "Quels sont les 3 principaux points forts et 2 axes d'amélioration pour ce candidat ?" },
  { label: "Questions d'entretien", question: 'Propose 5 questions d\'entretien pertinentes pour ce profil.' },
  { label: 'Adéquation poste', question: "Synthétise en une phrase l'adéquation du profil pour un poste en entreprise." },
]

export default function EvaluationForm({ candidateId, candidateData, candidatePhotoUrl, defaultAvatarUrl, onSuccess }) {
  const [ratings, setRatings] = useState({})
  const [comments, setComments] = useState({})
  const [globalComment, setGlobalComment] = useState('')
  const [decision, setDecision] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(CRITERIA.map((c) => c.category))
  const [activeTab, setActiveTab] = useState('eval')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const synthesisRef = useRef(null)
  const evaluationHistory = candidateData?.admin_report?.evaluation_history || []

  // IA (CvGPT)
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [indexCvLoading, setIndexCvLoading] = useState(false)
  const [indexCvError, setIndexCvError] = useState(null)
  const [indexCvSuccess, setIndexCvSuccess] = useState(false)
  const indexCvInputRef = useRef(null)
  const hasAiProfile = Boolean(candidateData?.hrflow_profile_key)

  const candidat = {
    nom: candidateData?.last_name || '',
    prenom: candidateData?.first_name || '',
    poste: candidateData?.profile_title || '',
    date: new Date().toISOString().split('T')[0],
    recruteur: '',
    entreprise: '',
    source: '',
  }

  const updateRating = (id, value) => setRatings((prev) => ({ ...prev, [id]: value }))
  const updateComment = (id, value) => setComments((prev) => ({ ...prev, [id]: value }))
  const toggleCategory = (cat) =>
    setExpandedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))

  const getCategoryScore = useCallback(
    (category) => {
      const rated = category.items.filter((item) => ratings[item.id] > 0)
      if (rated.length === 0) return { score: 0, max: category.items.length * 5, avg: 0, count: rated.length, total: category.items.length }
      const sum = rated.reduce((acc, item) => acc + (ratings[item.id] || 0), 0)
      return { score: sum, max: category.items.length * 5, avg: sum / rated.length, count: rated.length, total: category.items.length }
    },
    [ratings]
  )

  const getWeightedTotal = useCallback(() => {
    let weightedSum = 0
    let totalWeight = 0
    CRITERIA.forEach((cat) => {
      const { avg, count } = getCategoryScore(cat)
      if (count > 0) {
        weightedSum += avg * cat.weight
        totalWeight += cat.weight
      }
    })
    return totalWeight > 0 ? (weightedSum / totalWeight) * 20 : 0
  }, [getCategoryScore])

  const totalScore = getWeightedTotal()
  const ratedCount = Object.values(ratings).filter((v) => v > 0).length
  const totalItems = CRITERIA.reduce((acc, c) => acc + c.items.length, 0)
  const completionPct = Math.round((ratedCount / totalItems) * 100)

  const getScoreLabel = (score) => {
    if (score >= 80) return { text: 'Excellent', color: CHARTE.success }
    if (score >= 65) return { text: 'Bon', color: CHARTE.primary }
    if (score >= 50) return { text: 'Satisfaisant', color: '#3B82F6' }
    if (score >= 35) return { text: 'À développer', color: CHARTE.warning }
    return { text: 'Insuffisant', color: CHARTE.danger }
  }

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
    } finally {
      setAiLoading(false)
    }
  }

  const insertAiInto = () => {
    if (!aiAnswer) return
    setGlobalComment((prev) => (prev ? prev + '\n\n' + aiAnswer : aiAnswer))
  }

  // Chargement initial : dépendre uniquement de candidateId pour éviter les boucles infinies
  useEffect(() => {
    if (!candidateId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const adminReport = candidateData?.admin_report
        if (adminReport?.ratings || adminReport?.summary || adminReport?.global_comment) {
          if (!cancelled) {
            setRatings(adminReport.ratings || {})
            setComments(adminReport.comments || {})
            setGlobalComment(adminReport.global_comment || adminReport.summary || '')
            setDecision(adminReport.decision || '')
          }
        } else {
          try {
            const evalData = await adminApi.getCandidateEvaluation(candidateId)
            if (!cancelled && evalData) {
              if (evalData.ratings) {
                setRatings(evalData.ratings || {})
                setComments(evalData.comments || {})
                setGlobalComment(evalData.global_comment || evalData.summary || '')
                setDecision(evalData.decision || '')
              } else {
                setGlobalComment(evalData.summary || '')
              }
            }
          } catch (evalErr) {
            if (!cancelled && adminReport) {
              setGlobalComment(adminReport.global_comment || adminReport.summary || '')
              setDecision(adminReport.decision || '')
            }
          }
        }
      } catch (err) {
        if (!cancelled) console.error('Erreur chargement évaluation:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [candidateId])

  const buildPayload = () => ({
    ratings: Object.fromEntries(Object.entries(ratings).filter(([, v]) => v > 0)),
    comments: comments,
    globalComment: globalComment,
    decision: decision,
    summary: globalComment,
    interview_notes: '',
    recommendations: '',
  })

  const handleSaveReserve = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      const payload = buildPayload()
      await adminApi.updateEvaluation(candidateId, payload)
      await onSuccess?.()
    } catch (err) {
      setError(getApiErrorDetail(err, 'Erreur lors de la sauvegarde'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleValidate = async () => {
    if (globalComment.trim().length < 20) {
      setError("L'avis global doit contenir au moins 20 caractères pour valider.")
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const payload = buildPayload()
      await adminApi.validateProfile(candidateId, payload)
      await onSuccess?.()
    } catch (err) {
      setError(getApiErrorDetail(err, 'Erreur lors de la validation'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (globalComment.trim().length < 20) {
      setError("L'avis global doit contenir au moins 20 caractères pour rejeter.")
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const payload = buildPayload()
      // Sauvegarder l'évaluation complète avant le rejet (ratings, comments)
      if (Object.keys(payload.ratings || {}).length > 0) {
        await adminApi.updateEvaluation(candidateId, payload)
      }
      await adminApi.rejectProfile(candidateId, {
        rejectionReason: globalComment,
        overallScore: totalScore / 20,
        interview_notes: '',
      })
      await onSuccess?.()
    } catch (err) {
      setError(getApiErrorDetail(err, 'Erreur lors du rejet'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => window.print()
  const generateSynthesis = () => setTimeout(() => synthesisRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

  const tabs = [
    { id: 'eval', label: 'Évaluation', Icon: BarChart3 },
    { id: 'synthese', label: 'Synthèse', Icon: FileText },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#226D68]" />
        <span className="text-sm text-[#6b7280]">Chargement de l&apos;évaluation...</span>
      </div>
    )
  }

  return (
    <div className="min-h-full rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm">
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Historique */}
      {evaluationHistory.length > 0 && (
        <details className="group mx-4 sm:mx-6 mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none text-sm font-medium text-[#2C2C2C] hover:bg-[#F4F6F8] transition-colors">
            <History className="h-4 w-4 text-[#226D68]" />
            Historique des évaluations ({evaluationHistory.length})
            <ChevronDown className="group-open:rotate-180 transition-transform h-4 w-4 text-[#6b7280]" />
          </summary>
          <div className="px-4 pb-4 pt-1 space-y-2 max-h-52 overflow-y-auto">
            {evaluationHistory.map((entry, index) => (
              <div key={index} className="rounded-lg border border-gray-100 bg-white p-3 text-sm">
                <div className="text-xs text-[#6b7280]">{entry.updated_at ? formatDateTime(entry.updated_at) : '—'}</div>
                {entry.total_score_100 != null && <div className="font-semibold text-[#226D68]">Score : {entry.total_score_100.toFixed(0)}/100</div>}
                {entry.summary && <p className="text-[#6b7280] mt-1 line-clamp-2 text-xs">{entry.summary}</p>}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Tabs + Score Badge */}
      <div className="flex items-center gap-0 bg-white border-b-2 border-gray-100 px-4 sm:px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setActiveTab(tab.id); if (tab.id === 'synthese') generateSynthesis() }}
            className={`flex items-center gap-2 px-4 sm:px-6 py-4 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-b-[#e76f51] text-[#226D68] font-bold'
                : 'border-b-transparent text-[#6b7280] font-medium hover:text-[#2C2C2C]'
            }`}
          >
            <tab.Icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-4 py-2">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-medium">Score global</div>
            <div className="text-[#226D68] font-extrabold text-xl">
              {totalScore.toFixed(0)}
              <span className="text-sm font-normal text-[#6b7280] opacity-70">/100</span>
            </div>
          </div>
          <button type="button" onClick={handlePrint} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#226D68] hover:bg-[#1a5a55] text-white text-xs font-semibold transition-colors">
            <Printer className="h-3.5 w-3.5" />
            Imprimer
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* TAB: Évaluation */}
        {activeTab === 'eval' && (
          <div className="flex flex-col gap-4">
            {candidat.nom && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#E8F4F3] flex items-center justify-center text-sm font-bold text-[#226D68] shrink-0">
                    {candidatePhotoUrl ? (
                      <img
                        src={candidatePhotoUrl}
                        alt={`${candidat.prenom} ${candidat.nom}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { if (defaultAvatarUrl) e.target.src = defaultAvatarUrl }}
                      />
                    ) : (
                      <span>{candidat.prenom?.[0]}{candidat.nom?.[0]}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{candidat.prenom} {candidat.nom}</div>
                    <div className="text-xs text-[#6b7280]">{candidat.poste}</div>
                  </div>
                </div>
                <div className="text-xs text-[#6b7280]">{ratedCount}/{totalItems} critères évalués</div>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4 justify-center flex-wrap">
              <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Échelle :</span>
              {Object.entries(RATING_LABELS).map(([val, info]) => (
                <div key={val} className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ background: info.color }}>{val}</div>
                  <span className="text-[11px] text-[#6b7280]">{info.label}</span>
                </div>
              ))}
            </div>

            {CRITERIA.map((cat) => {
              const { score, max, avg, count, total } = getCategoryScore(cat)
              const isExpanded = expandedCategories.includes(cat.category)
              const CatIcon = cat.Icon
              return (
                <div key={cat.category} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.category)}
                    className={`w-full px-5 py-4 flex items-center justify-between text-left transition-colors ${
                      isExpanded ? 'bg-[#E8F4F3]' : 'bg-white hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#226D68]/10 flex items-center justify-center">
                        <CatIcon className="h-5 w-5 text-[#226D68]" />
                      </div>
                      <div>
                        <div className="font-bold text-[#2C2C2C]">{cat.category}</div>
                        <div className="text-xs text-[#6b7280] mt-0.5">Pondération : {cat.weight}% · {count}/{total} évalués{avg > 0 ? ` · Moyenne : ${avg.toFixed(1)}/5` : ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-28"><ScoreGauge score={score} maxScore={max} /></div>
                      <ChevronDown className={`h-5 w-5 text-[#6b7280] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 border-t border-gray-100">
                      {cat.items.map((item, idx) => (
                        <div key={item.id} className={`py-4 ${idx < cat.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                          <div className="flex justify-between items-start gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                              <div className="font-semibold text-sm text-[#2C2C2C]">{item.label}</div>
                              <div className="text-xs text-[#6b7280] mt-1 leading-relaxed">{item.hint}</div>
                            </div>
                            <StarRating value={ratings[item.id] || 0} onChange={(val) => updateRating(item.id, val)} />
                          </div>
                          {ratings[item.id] > 0 && (
                            <textarea
                              value={comments[item.id] || ''}
                              onChange={(e) => updateComment(item.id, e.target.value)}
                              placeholder="Observations du recruteur (optionnel)..."
                              rows={2}
                              className="mt-3 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-[#F4F6F8] focus:ring-2 focus:ring-[#226D68]/30 focus:border-[#226D68] resize-y"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => { setActiveTab('synthese'); generateSynthesis() }}
                disabled={ratedCount === 0}
                className={`px-8 py-3.5 rounded-lg font-bold text-sm transition-colors ${
                  ratedCount > 0
                    ? 'bg-[#e76f51] hover:bg-[#d65a3d] text-white'
                    : 'bg-gray-200 text-[#6b7280] cursor-not-allowed'
                }`}
              >
                Générer la synthèse
              </button>
            </div>
          </div>
        )}

        {/* TAB: Synthèse */}
        {activeTab === 'synthese' && (
          <div ref={synthesisRef} className="flex flex-col gap-4">
            <div className="rounded-xl bg-gradient-to-br from-[#226D68] to-[#1a5a55] p-6 sm:p-7 text-white shadow-lg">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider opacity-75">Synthèse d&apos;évaluation</div>
                  <div className="text-xl font-bold mt-1">{candidat.prenom} {candidat.nom || '—'}</div>
                  <div className="text-sm opacity-90">{candidat.poste || 'Poste non renseigné'}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-extrabold">{totalScore.toFixed(0)}</div>
                  <div className="text-sm opacity-75">/ 100 points</div>
                  <div className="mt-1.5 px-4 py-1 rounded-full bg-white/20 text-xs font-bold">{getScoreLabel(totalScore).text}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-xs font-bold text-[#226D68] uppercase tracking-wider mb-4">Détail par catégorie</h3>
              <div className="flex flex-col gap-4">
                {CRITERIA.map((cat) => {
                  const { avg, count, total } = getCategoryScore(cat)
                  const catPct = avg > 0 ? (avg / 5) * 100 : 0
                  const CatIcon = cat.Icon
                  return (
                    <div key={cat.category}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <CatIcon className="h-4 w-4 text-[#226D68]" />
                          <span className="text-sm font-semibold">{cat.category}</span>
                          <span className="text-[11px] text-[#6b7280]">({cat.weight}%)</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: getScoreLabel(catPct).color }}>{avg > 0 ? `${avg.toFixed(1)}/5` : '—'}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                        <div className="h-full rounded transition-all duration-500" style={{ width: `${catPct}%`, background: getScoreLabel(catPct).color }} />
                      </div>
                      <div className="mt-1.5 pl-6">
                        {cat.items.filter((item) => ratings[item.id] > 0).map((item) => (
                          <div key={item.id} className="flex justify-between py-0.5 text-[11px]">
                            <span className="text-[#6b7280]">{item.label}</span>
                            <span className="font-semibold" style={{ color: RATING_LABELS[ratings[item.id]]?.color }}>
                              {ratings[item.id]}/5 — {RATING_LABELS[ratings[item.id]]?.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {Object.keys(comments).filter((k) => comments[k]).length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-xs font-bold text-[#226D68] uppercase tracking-wider mb-3">Observations du recruteur</h3>
                {Object.entries(comments)
                  .filter(([, v]) => v)
                  .map(([id, comment]) => {
                    const item = CRITERIA.flatMap((c) => c.items).find((i) => i.id === id)
                    return (
                      <div key={id} className="mb-3 p-3 bg-[#F4F6F8] rounded-lg border-l-4 border-[#226D68]">
                        <div className="text-xs font-semibold text-[#226D68] mb-1">{item?.label}</div>
                        <div className="text-sm text-[#2C2C2C] leading-relaxed">{comment}</div>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Analyse IA */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[#226D68]" />
                <h3 className="text-xs font-bold text-[#226D68] uppercase tracking-wider">Analyse par IA (CvGPT)</h3>
              </div>
              {!hasAiProfile ? (
                <div>
                  <p className="text-xs text-[#6b7280] mb-3">L&apos;analyse IA n&apos;est pas disponible (profil sans indexation HrFlow).</p>
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
                        setIndexCvError(err?.response?.data?.detail || err?.message || 'Erreur indexation')
                      } finally {
                        setIndexCvLoading(false)
                        e.target.value = ''
                      }
                    }}
                  />
                  <button type="button" onClick={() => indexCvInputRef.current?.click()} disabled={indexCvLoading} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 bg-white text-sm hover:bg-[#F4F6F8] disabled:opacity-50">
                    {indexCvLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {indexCvLoading ? 'Indexation…' : 'Indexer un CV'}
                  </button>
                  {indexCvSuccess && <span className="ml-3 text-xs text-emerald-600">CV indexé.</span>}
                  {indexCvError && <p className="mt-2 text-xs text-red-600">{indexCvError}</p>}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {AI_PRESET_QUESTIONS.map(({ label, question }) => (
                      <button key={label} type="button" onClick={() => askAi(question)} disabled={aiLoading} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs hover:bg-[#E8F4F3] hover:border-[#226D68]/30 disabled:opacity-50">
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <textarea value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} placeholder="Posez une question sur le profil..." rows={2} className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#226D68]/30 focus:border-[#226D68] disabled:opacity-50" disabled={aiLoading} />
                    <button type="button" onClick={() => askAi()} disabled={aiLoading || !aiQuestion.trim()} className="h-10 px-4 rounded-lg bg-[#226D68] hover:bg-[#1a5a55] text-white disabled:opacity-50 shrink-0">
                      {aiLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bot className="h-5 w-5" />}
                    </button>
                  </div>
                  {aiError && <p className="text-xs text-red-600">{aiError}</p>}
                  {aiAnswer && (
                    <div className="mt-3">
                      <div className="p-3 bg-[#F4F6F8] rounded-lg text-sm whitespace-pre-wrap">{aiAnswer}</div>
                      <button type="button" onClick={insertAiInto} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#226D68] bg-[#E8F4F3] text-[#226D68] text-xs font-medium hover:bg-[#226D68]/10">
                        <Copy className="h-3 w-3" />Insérer dans l&apos;avis global
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-xs font-bold text-[#226D68] uppercase tracking-wider mb-3">Avis global du recruteur</h3>
              <textarea
                value={globalComment}
                onChange={(e) => setGlobalComment(e.target.value)}
                placeholder="Synthèse qualitative : points forts, axes d'amélioration, impression générale, recommandation argumentée... (min. 20 caractères pour valider/rejeter)"
                rows={5}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#226D68]/30 focus:border-[#226D68] resize-y"
              />
              <div className="text-[11px] text-[#6b7280] mt-1">{(globalComment?.length || 0)} / 20 min. pour valider ou rejeter</div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-xs font-bold text-[#226D68] uppercase tracking-wider mb-4">Décision</h3>
              <div className="flex gap-3 flex-wrap">
                {DECISIONS.map((d) => {
                  const DIcon = d.Icon
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDecision(d.value)}
                      className={`flex-1 min-w-[140px] p-4 rounded-xl border-2 text-center transition-all ${
                        decision === d.value ? '' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={decision === d.value ? { borderColor: d.color, background: `${d.color}15` } : {}}
                    >
                      <DIcon className={`h-6 w-6 mx-auto mb-2 ${decision === d.value ? '' : 'text-[#6b7280]'}`} style={decision === d.value ? { color: d.color } : {}} />
                      <div className={`text-sm font-bold ${decision === d.value ? '' : 'text-[#2C2C2C]'}`} style={decision === d.value ? { color: d.color } : {}}>{d.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 justify-end flex-wrap pt-2">
              <button type="button" onClick={() => setActiveTab('eval')} className="h-10 px-5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-[#6b7280] hover:bg-[#F4F6F8] hover:text-[#2C2C2C]">
                Modifier l&apos;évaluation
              </button>
              <button type="button" onClick={handleSaveReserve} disabled={isSubmitting} className="h-10 px-5 rounded-lg border-2 border-amber-500 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 disabled:opacity-50 inline-flex items-center gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Sauvegarder en réserve
              </button>
              <button type="button" onClick={handleReject} disabled={isSubmitting || (globalComment?.trim().length || 0) < 20} className="h-10 px-5 rounded-lg border-2 border-red-500 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 inline-flex items-center gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Non retenu
              </button>
              <button type="button" onClick={handleValidate} disabled={isSubmitting || (globalComment?.trim().length || 0) < 20} className="h-10 px-5 rounded-lg bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Retenu — Valider le profil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
