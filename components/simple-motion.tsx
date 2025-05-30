"use client"

import { useEffect, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MotionDivProps {
  children: ReactNode
  initial?: { opacity?: number; y?: number; x?: number; scale?: number }
  animate?: { opacity?: number; y?: number; x?: number; scale?: number }
  transition?: { duration?: number; delay?: number; type?: string; stiffness?: number; damping?: number }
  variants?: any
  className?: string
  [key: string]: any
}

export function MotionDiv({
  children,
  initial = {},
  animate = {},
  transition = {},
  className,
  ...props
}: MotionDivProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, transition.delay || 0)

    return () => clearTimeout(timer)
  }, [transition.delay])

  const style = {
    opacity: isVisible ? (animate.opacity ?? 1) : (initial.opacity ?? 0),
    transform: `
      translateY(${isVisible ? (animate.y ?? 0) : (initial.y ?? 0)}px)
      translateX(${isVisible ? (animate.x ?? 0) : (initial.x ?? 0)}px)
      scale(${isVisible ? (animate.scale ?? 1) : (initial.scale ?? 1)})
    `,
    transition: `all ${transition.duration || 0.3}s ease-in-out`,
  }

  return (
    <div className={cn("transition-all", className)} style={style} {...props}>
      {children}
    </div>
  )
}

// Simple AnimatePresence alternative
export function AnimatePresence({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// Export as motion for compatibility
export const motion = {
  div: MotionDiv,
  aside: MotionDiv,
}
