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
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
}

export function ProCandidateKanban({ results, loading, onCandidateClick }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {results.map((candidate) => {
        const defaultAvatar = generateAvatarUrl(candidate.full_name || candidate.title || '')
        const displayPhoto = candidate.photo_url || defaultAvatar
        const overallScore = candidate.admin_score || (candidate.admin_report?.overall_score)

        return (
          <Card
            key={candidate.candidate_id}
            className="p-5 cursor-pointer hover:shadow-xl transition-all duration-300 rounded-[12px] shadow-sm bg-white border-l-4 border-l-transparent hover:border-l-[#226D68] group"
            onClick={() => onCandidateClick(candidate.candidate_id)}
          >
            {/* Photo et header */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative mb-3">
                <img
                  src={displayPhoto}
                  alt={candidate.full_name || candidate.title || 'Candidat'}
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#226D68]/20 shadow-md group-hover:border-[#226D68]/40 transition-colors"
                  onError={(e) => {
                    if (e.target.src !== defaultAvatar) {
                      e.target.src = defaultAvatar
                    }
                  }}
                />
                {/* Badge de score en overlay */}
                {overallScore !== null && overallScore !== undefined && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-[#e76f51] text-white rounded-full px-2.5 py-1 shadow-lg flex items-center gap-1 border-2 border-white z-10">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-xs font-bold whitespace-nowrap">
                      {typeof overallScore === 'number' ? overallScore.toFixed(1) : overallScore}/5
                    </span>
                  </div>
                )}
                {candidate.is_verified && (
                  <div className="absolute -top-1 -right-1 bg-[#226D68] rounded-full p-1 shadow-md z-10">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              
              {/* Nom et titre */}
              <h3 className="text-lg font-bold text-gray-anthracite font-heading text-center mb-1 line-clamp-1">
                {candidate.full_name || candidate.title || 'Candidat'}
              </h3>
              {(candidate.title || candidate.main_job) && (
                <p className="text-sm text-muted-foreground text-center mb-3 line-clamp-1">
                  {candidate.title || candidate.main_job}
                </p>
              )}
            </div>

            {/* Informations clés */}
            <div className="space-y-2 mb-4 pb-4 border-b border-border">
              {candidate.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-[#226D68] flex-shrink-0" />
                  <span className="truncate">{candidate.location}</span>
                </div>
              )}
              
              {candidate.years_of_experience !== undefined && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 text-blue-deep flex-shrink-0" />
                  <span>
                    {candidate.years_of_experience} an{candidate.years_of_experience > 1 ? 's' : ''} d'expérience
                  </span>
                </div>
              )}
              
              {candidate.availability && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-[#226D68] flex-shrink-0" />
                  <span className="truncate">{candidate.availability}</span>
                </div>
              )}
            </div>

            {/* Compétences */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.slice(0, 3).map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs bg-blue-deep/10 text-blue-deep border-blue-deep/20 px-2 py-0.5"
                    >
                      {typeof skill === 'object' ? skill.name : skill}
                    </Badge>
                  ))}
                  {candidate.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs border-blue-deep text-blue-deep px-2 py-0.5">
                      +{candidate.skills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Résumé */}
            {candidate.summary_highlight ? (
              <p 
                className="text-xs text-gray-anthracite line-clamp-2 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: candidate.summary_highlight }}
              />
            ) : candidate.summary ? (
              <p className="text-xs text-gray-anthracite line-clamp-2 leading-relaxed">
                {candidate.summary}
              </p>
            ) : null}
          </Card>
        )
      })}
    </div>
  )
}
