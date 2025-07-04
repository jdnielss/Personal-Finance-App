export const INDONESIAN_BANKS = [
  "BCA (Bank Central Asia)",
  "Mandiri",
  "BRI (Bank Rakyat Indonesia)",
  "BNI (Bank Negara Indonesia)",
  "CIMB Niaga",
  "Maybank",
  "Bank Jago",
  "Jenius (BTPN)",
  "Permata Bank",
  "Danamon",
  "OCBC NISP",
  "Panin Bank",
  "Bank Mega",
  "UOB Indonesia",
  "Standard Chartered",
]

export const E_WALLETS = [
  "GoPay (Gojek)",
  "OVO",
  "DANA",
  "ShopeePay",
  "LinkAja",
  "Jenius Pay",
  "Sakuku BCA",
  "i.saku BNI",
  "Livin' Mandiri",
  "BRImo",
]

export const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking Account" },
  { value: "savings", label: "Savings Account" },
  { value: "credit", label: "Credit Card" },
  { value: "ewallet", label: "E-Wallet" },
]

export const ACCOUNT_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
]

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Groceries",
  "Gas & Fuel",
  "Insurance",
  "Subscriptions",
  "Personal Care",
  "Home & Garden",
  "Gifts & Donations",
  "Other",
]

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investments",
  "Rental",
  "Side Hustle",
  "Bonus",
  "Commission",
  "Dividend",
  "Interest",
  "Gift",
  "Refund",
  "Cashback",
  "Other",
]

export const BUDGET_CATEGORIES = [
  "Housing",
  "Transportation",
  "Food & Dining",
  "Utilities",
  "Insurance",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Personal Care",
  "Education",
  "Savings",
  "Debt Payment",
  "Emergency Fund",
  "Investments",
  "Travel",
  "Gifts & Donations",
  "Miscellaneous",
]

export const INVESTMENT_TYPES = [
  "Stocks",
  "Bonds",
  "Mutual Funds",
  "ETF",
  "Cryptocurrency",
  "Real Estate",
  "Gold",
  "Savings Account",
  "Time Deposit",
  "P2P Lending",
  "Other",
]

export const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
]

export const CATEGORY_COLORS: { [key: string]: string } = {
  // Expense Categories
  "Food & Dining": "#ef4444",
  Transportation: "#3b82f6",
  Shopping: "#8b5cf6",
  Entertainment: "#f59e0b",
  "Bills & Utilities": "#10b981",
  Healthcare: "#ec4899",
  Travel: "#06b6d4",
  Education: "#84cc16",
  Groceries: "#22c55e",
  "Gas & Fuel": "#f97316",
  Insurance: "#6366f1",
  Subscriptions: "#a855f7",
  "Personal Care": "#d946ef",
  "Home & Garden": "#14b8a6",
  "Gifts & Donations": "#f43f5e",

  // Income Categories
  Salary: "#10b981",
  Freelance: "#3b82f6",
  Business: "#8b5cf6",
  Investments: "#f59e0b",
  Rental: "#ef4444",
  "Side Hustle": "#06b6d4",
  Bonus: "#84cc16",
  Commission: "#22c55e",
  Dividend: "#f97316",
  Interest: "#6366f1",
  Gift: "#ec4899",
  Refund: "#6b7280",
  Cashback: "#14b8a6",

  // Budget Categories
  Housing: "#ef4444",
  Utilities: "#10b981",
  Savings: "#22c55e",
  "Debt Payment": "#dc2626",
  "Emergency Fund": "#059669",
  Miscellaneous: "#6b7280",

  // Investment Types
  Stocks: "#3b82f6",
  Bonds: "#10b981",
  "Mutual Funds": "#8b5cf6",
  ETF: "#f59e0b",
  Cryptocurrency: "#f97316",
  "Real Estate": "#ef4444",
  Gold: "#eab308",
  "Time Deposit": "#06b6d4",
  "P2P Lending": "#ec4899",

  // Default
  Other: "#6b7280",
}
