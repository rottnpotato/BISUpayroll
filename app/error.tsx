'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h2 className="text-4xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-8">An unexpected error occurred.</p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  )
}
