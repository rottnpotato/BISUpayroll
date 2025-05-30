import Image from "next/image"
import { BisuSealSvg } from "./bisu-logos"

export function BisuLogo({
  size = "md",
  variant = "default",
  showText = true,
}: {
  size?: "sm" | "md" | "lg"
  variant?: "default" | "light"
  showText?: boolean
}) {
  const textSizeClass = size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-lg"
  const iconSize = size === "sm" ? 32 : size === "md" ? 40 : 50

  const textColor = variant === "light" ? "text-white" : "text-[#3A2E5A] dark:text-white"
  const primaryColor = variant === "light" ? "text-white" : "text-[#46246C]"
  const secondaryColor = variant === "light" ? "text-white/80" : "text-[#46246C]/80"

  return (
    <div className="flex items-center space-x-2 max-w-full overflow-hidden">
      <div className="relative flex-shrink-0">
        <Image
          src="/LOGO_BISU.svg"
          alt="BISU Logo"
          width={iconSize}
          height={iconSize}
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col overflow-hidden">
          <span className={`font-bold ${textSizeClass} ${primaryColor} whitespace-wrap `}>
            BOHOL ISLAND STATE UNIVERSITY
          </span>
          <span className={`font-medium text-xs ${secondaryColor} whitespace-wrap`}>
            BALILIHAN CAMPUS
          </span>
        </div>
      )}
    </div>
  )
}
