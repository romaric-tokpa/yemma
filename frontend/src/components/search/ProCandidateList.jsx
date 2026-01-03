import { CheckCircle2, MapPin, Briefcase } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { CandidateSkeleton } from './CandidateSkeleton'

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
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
        <Briefcase className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg">Aucun résultat trouvé</p>
        <p className="text-sm mt-2">Essayez de modifier vos critères de recherche</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {results.map((candidate) => (
        <Card
          key={candidate.candidate_id}
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onCandidateClick(candidate.candidate_id)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">{candidate.title || candidate.full_name}</h3>
                <Badge className="bg-green-500 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Certifié par l'Admin
                </Badge>
              </div>
            </div>
          </div>

          {/* 3 compétences clés */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {candidate.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {typeof skill === 'object' ? skill.name : skill}
                </Badge>
              ))}
            </div>
          )}

          {/* Localisation */}
          {candidate.location && (
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{candidate.location}</span>
            </div>
          )}

          {/* Résumé avec highlight si disponible */}
          {candidate.summary_highlight ? (
            <p 
              className="text-sm text-gray-700 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: candidate.summary_highlight }}
            />
          ) : candidate.summary ? (
            <p className="text-sm text-gray-700 line-clamp-2">
              {candidate.summary}
            </p>
          ) : null}

          {/* Expérience */}
          {candidate.years_of_experience !== undefined && (
            <div className="mt-3 text-sm text-gray-600">
              {candidate.years_of_experience} an{candidate.years_of_experience > 1 ? 's' : ''} d'expérience
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

