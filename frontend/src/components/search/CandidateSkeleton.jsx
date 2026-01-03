import { Card } from '../ui/card'

export function CandidateSkeleton() {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 w-24 bg-gray-200 rounded"></div>
        </div>

        {/* Compétences */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
        </div>

        {/* Localisation */}
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>

        {/* Résumé */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>

        {/* Expérience */}
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </Card>
  )
}

