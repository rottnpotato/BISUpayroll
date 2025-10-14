import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

const figtree = localFont({
  variable: "--font-figtree",
  display: "swap",
  src: [
    { path: "../public/fonts/Figtree-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Figtree-Regular.woff", weight: "400", style: "normal" },
    { path: "../public/fonts/Figtree-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Figtree-Medium.woff", weight: "500", style: "normal" },
    { path: "../public/fonts/Figtree-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/Figtree-SemiBold.woff", weight: "600", style: "normal" },
  ],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  title: "BISU Payroll System",
  description: "Payroll Management for Bohol Island State University",
  generator: 'rottenpotato',
  icons: {
    icon: '/LOGO_BISU.svg',
    apple: '/LOGO_BISU.svg',
    shortcut: '/LOGO_BISU.svg'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={figtree.variable}>
      <body className={`${figtree.className} min-h-screen flex flex-col text-base antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light" disableTransitionOnChange>
          <AuthProvider>
            <main className="flex-1 w-full mx-auto">
              {children}
            </main>
            <Toaster />
            <SonnerToaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
