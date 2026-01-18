import { CheckCircle2, MapPin, Briefcase, Calendar } from 'lucide-react'
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
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, index) => (
          <CandidateSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <Briefcase className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Aucun résultat trouvé</p>
        <p className="text-sm mt-2">Essayez de modifier vos critères de recherche</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {results.map((candidate) => (
        <Card
          key={candidate.candidate_id}
          className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary"
          onClick={() => onCandidateClick(candidate.candidate_id)}
        >
          <div className="flex items-start gap-4 mb-4">
            {/* Photo de profil */}
            <div className="flex-shrink-0">
              {(() => {
                const defaultAvatar = generateAvatarUrl(candidate.full_name || candidate.title || '')
                const displayPhoto = candidate.photo_url || defaultAvatar
                return (
                  <img
                    src={displayPhoto}
                    alt={candidate.full_name || candidate.title || 'Candidat'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                    onError={(e) => {
                      if (e.target.src !== defaultAvatar) {
                        e.target.src = defaultAvatar
                      }
                    }}
                  />
                )
              })()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-xl font-semibold text-foreground">
                  {candidate.full_name || candidate.title || 'Candidat'}
                </h3>
                {candidate.is_verified && (
                  <Badge className="bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
              </div>
              {/* Titre du profil (métier) */}
              {(candidate.title || candidate.main_job) && (
                <p className="text-sm text-muted-foreground mb-2">
                  {candidate.title || candidate.main_job}
                </p>
              )}
              
              {/* Localisation, expérience et disponibilité - juste en dessous du titre professionnel */}
              <div className="flex items-center gap-4 flex-wrap">
                {candidate.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{candidate.location}</span>
                  </div>
                )}
                
                {candidate.years_of_experience !== undefined && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm">
                      {candidate.years_of_experience} an{candidate.years_of_experience > 1 ? 's' : ''} d'expérience
                    </span>
                  </div>
                )}
                
                {candidate.availability && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{candidate.availability}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3 compétences clés */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {candidate.skills.slice(0, 5).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {typeof skill === 'object' ? skill.name : skill}
                </Badge>
              ))}
              {candidate.skills.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{candidate.skills.length - 5}
                </Badge>
              )}
            </div>
          )}

          {/* Résumé avec highlight si disponible */}
          {candidate.summary_highlight ? (
            <p 
              className="text-sm text-muted-foreground line-clamp-3"
              dangerouslySetInnerHTML={{ __html: candidate.summary_highlight }}
            />
          ) : candidate.summary ? (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {candidate.summary}
            </p>
          ) : null}
        </Card>
      ))}
    </div>
  )
}

