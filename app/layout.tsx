import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"
import { Poppins } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
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
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <body className={`${poppins.className} min-h-screen flex flex-col text-base antialiased`}>
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
