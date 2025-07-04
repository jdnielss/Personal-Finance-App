"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { formatNumberInput, parseNumberInput } from "@/lib/format"

interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  id?: string
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0.00",
  className,
  disabled,
  required,
  id,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("")

  useEffect(() => {
    if (value) {
      const numericValue = parseNumberInput(value)
      setDisplayValue(formatNumberInput(numericValue.toString()))
    } else {
      setDisplayValue("")
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Allow empty input
    if (inputValue === "") {
      setDisplayValue("")
      onChange("")
      return
    }

    // Format the input value
    const formatted = formatNumberInput(inputValue)
    setDisplayValue(formatted)

    // Pass the raw numeric value back to parent
    const numericValue = parseNumberInput(formatted)
    onChange(numericValue.toString())
  }

  const handleBlur = () => {
    if (displayValue && displayValue !== "") {
      const numericValue = parseNumberInput(displayValue)
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericValue)
      setDisplayValue(formatted)
    }
  }

  const handleFocus = () => {
    if (displayValue) {
      // Remove formatting for easier editing
      const numericValue = parseNumberInput(displayValue)
      setDisplayValue(numericValue.toString())
    }
  }

  return (
    <Input
      id={id}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      required={required}
    />
  )
}
