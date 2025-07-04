"use client"

import type React from "react"
import { createContext, useContext } from "react"

interface CurrencyContextType {
  currency: "IDR"
  formatCurrency: (amount: number) => string
  getCurrencySymbol: () => string
  getCurrencyCode: () => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getCurrencySymbol = (): string => {
    return "Rp"
  }

  const getCurrencyCode = (): string => {
    return "IDR"
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency: "IDR",
        formatCurrency,
        getCurrencySymbol,
        getCurrencyCode,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
