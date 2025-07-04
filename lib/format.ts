export const formatNumberInput = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const cleanValue = value.replace(/[^\d.]/g, "")

  // Split by decimal point
  const parts = cleanValue.split(".")

  // Format the integer part with commas
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")

  // Handle decimal part (limit to 2 decimal places)
  const decimalPart = parts[1] ? parts[1].substring(0, 2) : ""

  // Return formatted value
  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart
}

export const parseNumberInput = (value: string): number => {
  // Remove commas and parse as float
  const cleanValue = value.replace(/,/g, "")
  return Number.parseFloat(cleanValue) || 0
}

export const formatCurrencyInput = (value: string): string => {
  const numericValue = parseNumberInput(value)
  if (isNaN(numericValue)) return "0"

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}
