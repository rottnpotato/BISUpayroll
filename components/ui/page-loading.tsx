import { Spinner } from "@/components/ui/spinner"

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <Spinner size="lg" className="mb-4" />
      <p className="text-bisu-purple-deep dark:text-bisu-yellow-light text-lg font-medium">{message}</p>
    </div>
  )
}
