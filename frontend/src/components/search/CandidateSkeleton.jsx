import { Card } from '../ui/card'

export function CandidateSkeleton() {
  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6">
        <div className="animate-pulse">
          {/* Header avec photo et nom */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              <div className="absolute -top-2 -right-2 w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          
          {/* Détails */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          
          {/* Compétences */}
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-gray-200 rounded"></div>
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
              <div className="h-6 w-18 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </Card>
  )
}
