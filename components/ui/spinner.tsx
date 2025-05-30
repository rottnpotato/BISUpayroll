import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "spinner",
        {
          "spinner-sm": size === "sm",
          "spinner-lg": size === "lg",
        },
        className,
      )}
    />
  )
}
