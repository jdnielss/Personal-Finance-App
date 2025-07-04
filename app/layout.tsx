import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/providers/auth-provider"
import { CurrencyProvider } from "@/providers/currency-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Personal Finance Manager",
  description: "Track expenses, manage budgets, and monitor investments",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CurrencyProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </CurrencyProvider>
      </body>
    </html>
  )
}
