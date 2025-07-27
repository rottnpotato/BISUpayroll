import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AttendanceCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-gray-200">
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <div className="flex space-x-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>

        {/* Department and Date */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Time Information Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-3 w-12 mx-auto mb-2" />
            <Skeleton className="h-6 w-16 mx-auto" />
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-3 w-16 mx-auto mb-2" />
            <Skeleton className="h-6 w-16 mx-auto" />
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-3 w-12 mx-auto mb-2" />
            <Skeleton className="h-6 w-16 mx-auto" />
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between mb-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}
