import { CheckCircle2, Briefcase, Star, Award, Eye } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { ExpertReviewDialog } from './ExpertReviewDialog'
import { useState } from 'react'

export function CandidateCard({ candidate, onClick }) {
  const [showExpertReview, setShowExpertReview] = useState(false)
  const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Candidat'
  const isCertified = candidate.admin_score !== null && candidate.admin_score !== undefined
  
  // Récupérer les 3 compétences clés les plus pertinentes
  // Prioriser les compétences avec niveau EXPERT ou ADVANCED
  const getTopSkills = () => {
    if (!candidate.skills || candidate.skills.length === 0) return []
    
    const skills = candidate.skills.map(skill => {
      if (typeof skill === 'object') {
        return {
          name: skill.name || skill,
          level: skill.level || 'INTERMEDIATE'
        }
      }
      return { name: skill, level: 'INTERMEDIATE' }
    })
    
    // Trier par niveau (EXPERT > ADVANCED > INTERMEDIATE > BEGINNER)
    const levelOrder = { 'EXPERT': 4, 'ADVANCED': 3, 'INTERMEDIATE': 2, 'BEGINNER': 1 }
    skills.sort((a, b) => (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0))
    
    return skills.slice(0, 3)
  }
  
  const topSkills = getTopSkills()
  
  const handleExpertReviewClick = (e) => {
    e.stopPropagation() // Empêcher le clic de déclencher onClick du Card
    setShowExpertReview(true)
  }
  
  return (
    <>
      <Card 
        className="p-6 cursor-pointer hover:shadow-lg transition-shadow relative"
        onClick={onClick}
      >
        {/* En-tête avec nom et badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{fullName}</h3>
            {isCertified && (
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-sm">
                  <Award className="h-3 w-3 mr-1" />
                  Certifié par Yemma
                </Badge>
                {candidate.admin_score !== null && candidate.admin_score !== undefined && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-semibold">{candidate.admin_score.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">/5</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Titre du poste */}
        {candidate.profile_title && (
          <div className="mb-3">
            <h4 className="text-base font-medium text-gray-900">{candidate.profile_title}</h4>
          </div>
        )}

        {/* Résumé professionnel */}
        {candidate.professional_summary && (
          <p className="text-sm text-gray-700 mb-4 line-clamp-3 leading-relaxed">
            {candidate.professional_summary}
          </p>
        )}

        {/* 3 compétences clés */}
        {topSkills.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Compétences clés</p>
            <div className="flex flex-wrap gap-2">
              {topSkills.map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                >
                  {skill.name}
                  {skill.level === 'EXPERT' && (
                    <span className="ml-1 text-[10px]">⭐</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Informations supplémentaires */}
        <div className="space-y-2 mb-4 pt-3 border-t border-gray-100">
          {candidate.sector && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Briefcase className="h-4 w-4" />
              <span>{candidate.sector}</span>
              {candidate.main_job && <span>• {candidate.main_job}</span>}
            </div>
          )}
          {candidate.total_experience !== undefined && (
            <div className="text-sm text-gray-600">
              {candidate.total_experience} an{candidate.total_experience > 1 ? 's' : ''} d'expérience
            </div>
          )}
        </div>

        {/* Bouton Avis Expert */}
        {isCertified && (
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={handleExpertReviewClick}
              className="w-full text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 py-2 hover:bg-blue-50 rounded-md transition-colors"
              title="Voir le compte-rendu de l'expert"
            >
              <Eye className="h-4 w-4" />
              Voir l'avis de l'expert
            </button>
          </div>
        )}
      </Card>
      
      {showExpertReview && (
        <ExpertReviewDialog
          candidate={candidate}
          open={showExpertReview}
          onOpenChange={setShowExpertReview}
        />
      )}
    </>
  )
}

