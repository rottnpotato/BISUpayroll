import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  className?: string
  hasHeader?: boolean
  lines?: number
}

export function SkeletonCard({ className, hasHeader = true, lines = 3 }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border border-gray-200 bg-white p-4 shadow animate-pulse", className)}>
      {hasHeader && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-gray-200"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-3 w-1/2 rounded bg-gray-200"></div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`h-3 rounded bg-gray-200 ${i === lines - 1 ? "w-3/4" : "w-full"}`}></div>
        ))}
      </div>
    </div>
  )
}
