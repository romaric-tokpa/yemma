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
} from 'lucide-react'
import { useState, useEffect } from 'react'

// Version simplifiée pour la démo - utilise les données mockées directement
export function DemoExpertReviewDialog({ candidate, open, onOpenChange }) {
  const [evaluation, setEvaluation] = useState(null)

  useEffect(() => {
    if (open && candidate?.admin_report) {
      // Utiliser directement les données admin_report du candidat mocké
      const adminReport = candidate.admin_report
      setEvaluation({
        overallScore: adminReport.overall_score || candidate.admin_score,
        softSkills: adminReport.soft_skills_rating,
        technicalSkills: adminReport.technical_skills_rating,
        communication: adminReport.communication_rating,
        motivation: adminReport.motivation_rating,
        summary: adminReport.summary,
        strengths: adminReport.strengths || [],
        recommendations: adminReport.recommendations || [],
      })
    }
  }, [open, candidate])

  if (!candidate) return null

  const fullName = candidate.full_name || `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Candidat'
  const primaryColor = '#226D68'
  const secondaryColor = '#e76f51'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Avis de l'Expert
                </DialogTitle>
                <DialogDescription className="text-base mt-1 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  Évaluation détaillée de {fullName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {evaluation ? (
            <div className="space-y-6 mt-6">
              {/* Score Global */}
              {evaluation.overallScore !== null && evaluation.overallScore !== undefined && (
                <div className="relative bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-blue-200 shadow-sm overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h3 className="font-bold text-gray-900 text-lg">Score Global</h3>
                      </div>
                      <p className="text-sm text-gray-600">Évaluation globale du profil</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
                        <Star className="h-7 w-7 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                        <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {evaluation.overallScore.toFixed(1)}
                        </span>
                        <span className="text-xl text-gray-500">/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scores détaillés */}
              {(evaluation.technicalSkills !== null ||
                evaluation.softSkills !== null ||
                evaluation.communication !== null ||
                evaluation.motivation !== null) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" style={{ color: primaryColor }} />
                    Notes détaillées
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {evaluation.technicalSkills !== null && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <Code className="h-4 w-4" style={{ color: primaryColor }} />
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
                      </div>
                    )}
                    {evaluation.softSkills !== null && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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
                      </div>
                    )}
                    {evaluation.communication !== null && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="h-4 w-4" style={{ color: primaryColor }} />
                          <h5 className="text-xs font-semibold text-gray-700">Communication</h5>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xl font-bold text-gray-900">
                            {evaluation.communication.toFixed(1)}/5
                          </span>
                        </div>
                      </div>
                    )}
                    {evaluation.motivation !== null && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4" style={{ color: secondaryColor }} />
                          <h5 className="text-xs font-semibold text-gray-700">Motivation</h5>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xl font-bold text-gray-900">
                            {evaluation.motivation.toFixed(1)}/5
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Points forts */}
              {evaluation.strengths && evaluation.strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" style={{ color: primaryColor }} />
                    Points forts
                  </h4>
                  <div className="space-y-2">
                    {evaluation.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                        <span className="text-sm text-gray-700">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résumé de l'évaluation */}
              {evaluation.summary && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" style={{ color: primaryColor }} />
                    Compte-rendu de l'Expert
                  </h4>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {evaluation.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Recommandations */}
              {evaluation.recommendations && evaluation.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    Recommandations
                  </h4>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm">
                    <ul className="space-y-2">
                      {evaluation.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-yellow-600 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">Aucune évaluation disponible pour ce candidat.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
