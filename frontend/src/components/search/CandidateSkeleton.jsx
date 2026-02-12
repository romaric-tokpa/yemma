import { Card } from '../ui/card'

export function CandidateSkeleton() {
  return (
    <Card className="bg-white border border-[#e5e7eb] rounded-lg shadow-none">
      <div className="p-3">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-lg bg-[#e5e7eb]" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-[#e5e7eb] rounded w-1/3" />
            <div className="h-3 bg-[#e5e7eb] rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-3 w-16 bg-[#e5e7eb] rounded" />
              <div className="h-3 w-20 bg-[#e5e7eb] rounded" />
            </div>
            <div className="flex gap-1 mt-2">
              <div className="h-5 w-14 bg-[#e5e7eb] rounded" />
              <div className="h-5 w-16 bg-[#e5e7eb] rounded" />
              <div className="h-5 w-12 bg-[#e5e7eb] rounded" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-8 w-16 bg-[#e5e7eb] rounded" />
            <div className="h-8 w-8 bg-[#e5e7eb] rounded" />
            <div className="h-8 w-8 bg-[#e5e7eb] rounded" />
          </div>
        </div>
      </div>
    </Card>
  )
}
