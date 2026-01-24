import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Badge } from '../ui/badge'
import {
  Star,
  Award,
  User,
  Code,
  MessageCircle,
  TrendingUp,
  FileText,
  Lightbulb,
  ClipboardList,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { candidateApi, adminApi } from '../../services/api'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Variantes d'animation pour le contenu de la modale
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1], // Easing premium
    },
  },
}

const scoreVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      delay: 0.3,
    },
  },
}

const badgeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i) => ({
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      delay: i * 0.05,
    },
  }),
}

// Animation pour le DialogContent
const dialogVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
}

export function ExpertReviewDialog({ candidate, open, onOpenChange }) {
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && candidate?.candidate_id) {
      loadEvaluation()
    }
  }, [open, candidate?.candidate_id])

  const loadEvaluation = async () => {
    setLoading(true)
    try {
      // Récupérer l'évaluation depuis le service Admin
      // Le service Admin récupère le rapport d'évaluation stocké dans le Candidate Service
      const evaluationData = await adminApi.getCandidateEvaluation(candidate.candidate_id)

      if (evaluationData) {
        setEvaluation({
          overallScore: evaluationData.overall_score || candidate.admin_score,
          softSkills: evaluationData.soft_skills_rating,
          technicalSkills: evaluationData.technical_skills_rating,
          communication: evaluationData.communication_rating,
          motivation: evaluationData.motivation_rating,
          summary: evaluationData.summary,
          softSkillsTags: evaluationData.soft_skills_tags || [],
          recommendations: evaluationData.recommendations,
          interviewNotes: evaluationData.interview_notes,
        })
      } else {
        // Si pas d'évaluation détaillée, utiliser les données de base
        setEvaluation({
          overallScore: candidate.admin_score,
          summary: null,
        })
      }
    } catch (error) {
      console.error('Error loading evaluation from Admin Service:', error)
      // En cas d'erreur, essayer de récupérer depuis Candidate Service en fallback
      try {
        const profile = await candidateApi.getProfile(candidate.candidate_id)
        const adminReport = profile.admin_report || {}

        if (adminReport.summary || candidate.admin_score) {
          setEvaluation({
            overallScore: adminReport.overall_score || candidate.admin_score,
            softSkills: adminReport.soft_skills_rating,
            technicalSkills: adminReport.technical_skills_rating,
            communication: adminReport.communication_rating,
            motivation: adminReport.motivation_rating,
            summary: adminReport.summary,
            softSkillsTags: adminReport.soft_skills_tags || [],
            recommendations: adminReport.recommendations,
            interviewNotes: adminReport.interview_notes,
          })
        } else {
          setEvaluation({
            overallScore: candidate.admin_score,
            summary: null,
          })
        }
      } catch (fallbackError) {
        console.error('Error loading evaluation from Candidate Service:', fallbackError)
        // En dernier recours, utiliser les données de base
        setEvaluation({
          overallScore: candidate.admin_score,
          summary: null,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!candidate) return null

  const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Candidat'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
            <motion.div
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-6"
            >
              <DialogHeader>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: 0.2,
                    }}
                    className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg"
                  >
                    <Award className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Avis de l'Expert
                    </DialogTitle>
                    <DialogDescription className="text-base mt-1 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      Évaluation détaillée de {fullName}
                    </DialogDescription>
                  </div>
                </motion.div>
              </DialogHeader>

              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <Loader2 className="h-8 w-8 text-blue-500" />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-gray-500 mt-4"
                    >
                      Chargement de l'évaluation...
                    </motion.p>
                  </motion.div>
                ) : evaluation ? (
                  <motion.div
                    key="content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6 mt-6"
                  >
                    {/* Score Global */}
                    {evaluation.overallScore !== null && evaluation.overallScore !== undefined && (
                      <motion.div
                        variants={itemVariants}
                        className="relative bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-blue-200 shadow-sm overflow-hidden"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 15,
                            delay: 0.4,
                          }}
                          className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full -mr-16 -mt-16 blur-2xl"
                        />
                        <div className="relative flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-5 w-5 text-purple-600" />
                              <h3 className="font-bold text-gray-900 text-lg">Score Global</h3>
                            </div>
                            <p className="text-sm text-gray-600">Évaluation globale du profil</p>
                          </div>
                          <motion.div
                            variants={scoreVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex items-center gap-2"
                          >
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: 'spring', stiffness: 400 }}
                              className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md"
                            >
                              <Star className="h-7 w-7 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                              <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {evaluation.overallScore.toFixed(1)}
                              </span>
                              <span className="text-xl text-gray-500">/5</span>
                            </motion.div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {/* Scores détaillés */}
                    {(evaluation.technicalSkills !== null ||
                      evaluation.softSkills !== null ||
                      evaluation.communication !== null ||
                      evaluation.motivation !== null) && (
                      <motion.div variants={itemVariants}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-blue-600" />
                          Notes détaillées
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {evaluation.technicalSkills !== null && (
                            <motion.div
                              variants={itemVariants}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Code className="h-4 w-4 text-blue-600" />
                                <h5 className="text-xs font-semibold text-gray-700">
                                  Compétences Techniques
                                </h5>
                              </div>
                              <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xl font-bold text-gray-900">
                                  {evaluation.technicalSkills.toFixed(1)}/5
                                </span>
                              </div>
                            </motion.div>
                          )}
                          {evaluation.softSkills !== null && (
                            <motion.div
                              variants={itemVariants}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-purple-600" />
                                <h5 className="text-xs font-semibold text-gray-700">Soft Skills</h5>
                              </div>
                              <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xl font-bold text-gray-900">
                                  {evaluation.softSkills.toFixed(1)}/5
                                </span>
                              </div>
                            </motion.div>
                          )}
                          {evaluation.communication !== null && (
                            <motion.div
                              variants={itemVariants}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <MessageCircle className="h-4 w-4 text-[#226D68]" />
                                <h5 className="text-xs font-semibold text-gray-700">Communication</h5>
                              </div>
                              <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xl font-bold text-gray-900">
                                  {evaluation.communication.toFixed(1)}/5
                                </span>
                              </div>
                            </motion.div>
                          )}
                          {evaluation.motivation !== null && (
                            <motion.div
                              variants={itemVariants}
                              whileHover={{ scale: 1.02, y: -2 }}
                              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-[#e76f51]" />
                                <h5 className="text-xs font-semibold text-gray-700">Motivation</h5>
                              </div>
                              <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xl font-bold text-gray-900">
                                  {evaluation.motivation.toFixed(1)}/5
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Tags Soft Skills */}
                    {evaluation.softSkillsTags && evaluation.softSkillsTags.length > 0 && (
                      <motion.div variants={itemVariants}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#226D68]" />
                          Soft Skills identifiés
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {evaluation.softSkillsTags.map((tag, index) => (
                            <motion.div
                              key={index}
                              custom={index}
                              variants={badgeVariants}
                              initial="hidden"
                              animate="visible"
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Badge
                                variant="secondary"
                                className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200 shadow-sm hover:shadow-md transition-shadow"
                              >
                                {tag}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Résumé de l'évaluation */}
                    {evaluation.summary && (
                      <motion.div variants={itemVariants}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          Compte-rendu de l'Expert
                        </h4>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm"
                        >
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {evaluation.summary}
                          </p>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Recommandations */}
                    {evaluation.recommendations && (
                      <motion.div variants={itemVariants}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-600" />
                          Recommandations
                        </h4>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 }}
                          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm"
                        >
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {evaluation.recommendations}
                          </p>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Notes d'entretien */}
                    {evaluation.interviewNotes && (
                      <motion.div variants={itemVariants}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-[#e76f51]" />
                          Notes d'entretien
                        </h4>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                          className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border border-yellow-200 shadow-sm"
                        >
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {evaluation.interviewNotes}
                          </p>
                        </motion.div>
                      </motion.div>
                    )}

                    {!evaluation.summary &&
                      !evaluation.recommendations &&
                      !evaluation.interviewNotes && (
                        <motion.div
                          variants={itemVariants}
                          className="text-center py-12 text-gray-500"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.5 }}
                            className="mb-4"
                          >
                            <FileText className="h-12 w-12 mx-auto text-gray-300" />
                          </motion.div>
                          <p className="text-sm">Aucun compte-rendu détaillé disponible pour ce candidat.</p>
                          <p className="text-xs mt-2">
                            Score global uniquement : {evaluation.overallScore?.toFixed(1)}/5
                          </p>
                        </motion.div>
                      )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12 text-gray-500"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="mb-4"
                    >
                      <Award className="h-12 w-12 mx-auto text-gray-300" />
                    </motion.div>
                    <p className="text-sm">Aucune évaluation disponible pour ce candidat.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
