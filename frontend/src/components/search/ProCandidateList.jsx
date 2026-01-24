import { CheckCircle2, MapPin, Briefcase, Calendar, Star, Award, Eye } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { CandidateSkeleton } from './CandidateSkeleton'
import { ExpertReviewDialog } from './ExpertReviewDialog'
import { DemoExpertReviewDialog } from './DemoExpertReviewDialog'
import { useState, useEffect } from 'react'
import { generateAvatarFromFullName } from '@/utils/photoUtils'

// Générer les initiales pour l'avatar local
const getInitials = (fullName) => {
  const parts = fullName.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return (parts[0]?.[0] || 'C').toUpperCase()
}

export function ProCandidateList({ results, loading, onCandidateClick, isDemo = false }) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, index) => (
          <CandidateSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <Card className="rounded-[16px] shadow-sm border-2 border-dashed border-gray-200 p-16 text-center bg-gradient-to-br from-gray-50 to-white">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#226D68]/20 to-blue-deep/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Briefcase className="h-10 w-10 text-[#226D68]" />
          </div>
          <h3 className="text-xl font-bold text-gray-anthracite mb-2 font-heading">
            Aucun candidat trouvé
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Essayez de modifier vos critères de recherche ou d'ajuster les filtres pour trouver des candidats correspondant à vos besoins.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((candidate) => {
        const fullName = candidate.full_name || candidate.title || 'Candidat'
        const initials = getInitials(fullName)
        const overallScore = candidate.admin_score || (candidate.admin_report?.overall_score)
        const isCertified = overallScore !== null && overallScore !== undefined
        
        return (
          <CandidateCardItem
            key={candidate.candidate_id}
            candidate={candidate}
            fullName={fullName}
            initials={initials}
            overallScore={overallScore}
            isCertified={isCertified}
            onCandidateClick={onCandidateClick}
            isDemo={isDemo}
          />
        )
      })}
    </div>
  )
}

function CandidateCardItem({ candidate, fullName, initials, overallScore, isCertified, onCandidateClick, isDemo = false }) {
  const [showExpertReview, setShowExpertReview] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(candidate.photo_url)

  // Réinitialiser l'URL de la photo si elle change
  useEffect(() => {
    if (candidate.photo_url) {
      setPhotoUrl(candidate.photo_url)
      setPhotoError(false)
    }
  }, [candidate.photo_url])

  const handleExpertReviewClick = (e) => {
    e.stopPropagation()
    setShowExpertReview(true)
  }

  const handleCardClick = () => {
    onCandidateClick(candidate.candidate_id)
  }

  // URL de la photo ou avatar par défaut
  const defaultAvatarUrl = generateAvatarFromFullName(fullName)
  const hasPhoto = photoUrl && !photoError

  // Récupérer les 3 compétences clés les plus pertinentes
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
    
    const levelOrder = { 'EXPERT': 4, 'ADVANCED': 3, 'INTERMEDIATE': 2, 'BEGINNER': 1 }
    skills.sort((a, b) => (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0))
    
    return skills.slice(0, 3)
  }
  
  const topSkills = getTopSkills()
  
  return (
    <>
      <Card 
        className="rounded-[20px] shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300 hover:border-[#226D68]/50 group overflow-hidden cursor-pointer bg-white h-full flex flex-col hover:-translate-y-1"
        onClick={handleCardClick}
      >
        <CardContent className="p-6 flex flex-col flex-1">
          {/* Header avec avatar et badges en overlay */}
          <div className="relative mb-5">
            {/* Avatar avec photo ou initiales */}
            <div className="relative flex items-center justify-center mb-4">
              {hasPhoto ? (
                <img
                  src={photoUrl}
                  alt={fullName}
                  className="h-20 w-20 rounded-full object-cover shadow-xl ring-4 ring-white relative z-10 group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    if (!photoError) {
                      setPhotoError(true)
                      e.target.src = defaultAvatarUrl
                    } else if (e.target.src !== defaultAvatarUrl) {
                      e.target.src = defaultAvatarUrl
                    }
                  }}
                  onLoad={() => {
                    // Si l'image se charge avec succès, réinitialiser l'erreur
                    if (photoError && photoUrl) {
                      setPhotoError(false)
                    }
                  }}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#226D68] via-[#1a5a55] to-blue-deep flex items-center justify-center text-white font-bold text-2xl shadow-xl ring-4 ring-white relative z-10 group-hover:scale-105 transition-transform duration-300">
                  {initials}
                </div>
              )}
              
              {/* Badge de score en overlay */}
              {isCertified && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#e76f51] via-[#d45a3f] to-[#c04a2f] text-white rounded-full px-3 py-1.5 shadow-xl flex items-center gap-1.5 border-2 border-white z-20 group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="text-xs font-bold whitespace-nowrap">
                    {typeof overallScore === 'number' ? overallScore.toFixed(1) : overallScore}/5
                  </span>
                </div>
              )}
              
              {/* Badge vérifié */}
              {candidate.is_verified && (
                <div className="absolute -top-2 -right-2 bg-[#226D68] rounded-full p-1.5 shadow-lg z-20 border-2 border-white group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            
            {/* Nom et titre */}
            <div className="text-center mb-4">
              <h3 className="font-bold text-xl text-gray-anthracite font-heading mb-2 group-hover:text-[#226D68] transition-colors duration-300 line-clamp-1">
                {fullName}
              </h3>
              {(candidate.title || candidate.main_job) && (
                <h4 className="text-base font-semibold text-gray-700 mb-3 line-clamp-1">
                  {candidate.title || candidate.main_job}
                </h4>
              )}
              
              {/* Badges certifié et vérifié */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {isCertified && (
                  <Badge className="text-xs font-semibold px-3 py-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
                    <Award className="h-3.5 w-3.5 mr-1.5" />
                    Certifié Yemma
                  </Badge>
                )}
                {candidate.is_verified && (
                  <Badge className="text-xs font-semibold px-3 py-1.5 bg-[#226D68] text-white border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Vérifié
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Informations clés en grille */}
          <div className="grid grid-cols-1 gap-2.5 mb-4">
            {/* Localisation */}
            {candidate.location && (
              <div className="flex items-center gap-2.5 text-sm bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg px-3 py-2.5 border border-gray-200/50">
                <MapPin className="h-4 w-4 text-[#226D68] flex-shrink-0" />
                <span className="text-gray-700 font-medium truncate">{candidate.location}</span>
              </div>
            )}
            
            {/* Expérience et disponibilité en ligne */}
            <div className="flex items-center gap-2.5">
              {candidate.years_of_experience !== undefined && (
                <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg px-3 py-2.5 flex-1 border border-gray-200/50">
                  <Briefcase className="h-4 w-4 text-blue-deep flex-shrink-0" />
                  <span className="text-gray-700 font-medium text-xs">
                    {candidate.years_of_experience} an{candidate.years_of_experience > 1 ? 's' : ''} d'exp.
                  </span>
                </div>
              )}
              
              {candidate.availability && (
                <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg px-3 py-2.5 flex-1 border border-gray-200/50">
                  <Calendar className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium text-xs truncate">{candidate.availability}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Compétences clés avec design amélioré */}
          {topSkills.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wide">Compétences clés</p>
              <div className="flex flex-wrap gap-2">
                {topSkills.map((skill, index) => (
                  <Badge 
                    key={index} 
                    className="text-xs font-medium px-2.5 py-1 bg-gradient-to-r from-blue-deep/10 via-blue-deep/8 to-blue-deep/5 text-blue-deep border border-blue-deep/20 hover:border-blue-deep/40 hover:shadow-sm transition-all"
                  >
                    {skill.name}
                    {skill.level === 'EXPERT' && (
                      <Star className="h-3 w-3 ml-1.5 text-[#e76f51] fill-current" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Résumé professionnel avec design amélioré */}
          {(candidate.summary_highlight || candidate.summary) && (
            <div className="mb-4 flex-1 min-h-[60px]">
              {candidate.summary_highlight ? (
                <p 
                  className="text-sm text-gray-700 line-clamp-3 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: candidate.summary_highlight }}
                />
              ) : (
                <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                  {candidate.summary}
                </p>
              )}
            </div>
          )}
          
          {/* Actions en bas */}
          <div className="pt-4 border-t border-gray-200 mt-auto">
            {isCertified ? (
              <button
                onClick={handleExpertReviewClick}
                className="w-full text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 hover:from-blue-700 hover:via-purple-700 hover:to-purple-800 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-[1.02]"
                title="Voir le compte-rendu de l'expert"
              >
                <Eye className="h-4 w-4" />
                Voir l'avis de l'expert
              </button>
            ) : (
              <button
                onClick={handleCardClick}
                className="w-full text-sm font-semibold text-[#226D68] bg-[#226D68]/10 hover:bg-[#226D68]/20 border-2 border-[#226D68]/30 hover:border-[#226D68]/50 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-300 hover:shadow-md transform hover:scale-[1.02]"
              >
                Voir le profil complet
              </button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {showExpertReview && (
        isDemo ? (
          <DemoExpertReviewDialog
            candidate={candidate}
            open={showExpertReview}
            onOpenChange={setShowExpertReview}
          />
        ) : (
          <ExpertReviewDialog
            candidate={candidate}
            open={showExpertReview}
            onOpenChange={setShowExpertReview}
          />
        )
      )}
    </>
  )
}
