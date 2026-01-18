import { CheckCircle2, MapPin, Briefcase, Calendar, Star } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { CandidateSkeleton } from './CandidateSkeleton'

// Générer un avatar par défaut basé sur les initiales
const generateAvatarUrl = (fullName) => {
  const parts = fullName.split(' ').filter(Boolean)
  const initials = parts.length >= 2 
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (parts[0]?.[0] || 'U').toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=128&background=random&color=fff&bold=true`
}

export function ProCandidateList({ results, loading, onCandidateClick }) {
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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12">
        <Briefcase className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">Aucun résultat trouvé</p>
        <p className="text-sm mt-2">Essayez de modifier vos critères de recherche</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {results.map((candidate) => {
        const defaultAvatar = generateAvatarUrl(candidate.full_name || candidate.title || '')
        const displayPhoto = candidate.photo_url || defaultAvatar
        const overallScore = candidate.admin_score || (candidate.admin_report?.overall_score)

        return (
          <Card
            key={candidate.candidate_id}
            className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border-l-4 border-l-transparent hover:border-l-green-emerald rounded-[12px] shadow-sm bg-white group"
            onClick={() => onCandidateClick(candidate.candidate_id)}
          >
            <div className="flex items-start gap-6">
              {/* Photo de profil avec badge de score */}
              <div className="flex-shrink-0 relative">
                <img
                  src={displayPhoto}
                  alt={candidate.full_name || candidate.title || 'Candidat'}
                  className="w-20 h-20 rounded-full object-cover border-2 border-green-emerald/20 shadow-md group-hover:border-green-emerald/40 transition-colors"
                  onError={(e) => {
                    if (e.target.src !== defaultAvatar) {
                      e.target.src = defaultAvatar
                    }
                  }}
                />
                {/* Badge de score en overlay sur la photo */}
                {overallScore !== null && overallScore !== undefined && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white rounded-full px-2.5 py-1 shadow-lg flex items-center gap-1 border-2 border-white z-10">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-xs font-bold whitespace-nowrap">
                      {typeof overallScore === 'number' ? overallScore.toFixed(1) : overallScore}/5
                    </span>
                  </div>
                )}
                {candidate.is_verified && (
                  <div className="absolute -top-1 -right-1 bg-green-emerald rounded-full p-1 shadow-md z-10">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              
              {/* Informations principales */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-anthracite font-heading">
                    {candidate.full_name || candidate.title || 'Candidat'}
                  </h3>
                  {candidate.is_verified && (
                    <Badge className="bg-green-emerald text-white border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Vérifié
                    </Badge>
                  )}
                </div>
                
                {/* Titre du profil (métier) */}
                {(candidate.title || candidate.main_job) && (
                  <p className="text-base text-gray-anthracite font-medium mb-3">
                    {candidate.title || candidate.main_job}
                  </p>
                )}
                
                {/* Localisation, expérience et disponibilité */}
                <div className="flex items-center gap-6 flex-wrap mb-4">
                  {candidate.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-green-emerald" />
                      <span className="text-sm">{candidate.location}</span>
                    </div>
                  )}
                  
                  {candidate.years_of_experience !== undefined && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4 text-blue-deep" />
                      <span className="text-sm">
                        {candidate.years_of_experience} an{candidate.years_of_experience > 1 ? 's' : ''} d'expérience
                      </span>
                    </div>
                  )}
                  
                  {candidate.availability && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-green-emerald" />
                      <span className="text-sm">{candidate.availability}</span>
                    </div>
                  )}
                </div>

                {/* Compétences clés */}
                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 pt-4 border-t border-border">
                    {candidate.skills.slice(0, 6).map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs bg-blue-deep/10 text-blue-deep border-blue-deep/20"
                      >
                        {typeof skill === 'object' ? skill.name : skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 6 && (
                      <Badge variant="outline" className="text-xs border-blue-deep text-blue-deep">
                        +{candidate.skills.length - 6}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Résumé avec highlight si disponible */}
                {(candidate.summary_highlight || candidate.summary) && (
                  <p 
                    className="text-sm text-gray-anthracite line-clamp-2 leading-relaxed"
                    dangerouslySetInnerHTML={candidate.summary_highlight ? { __html: candidate.summary_highlight } : undefined}
                  >
                    {!candidate.summary_highlight && candidate.summary}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
