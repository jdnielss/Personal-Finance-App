"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, TrendingUp, TrendingDown, CreditCard, Wallet, PieChart, BarChart3, Loader2 } from "lucide-react"
import { useCurrency } from "@/providers/currency-provider"
import { useApi } from "@/hooks/use-api"

interface BudgetData {
  category: string
  budget: number
  spent: number
  color: string
}

interface BankAccount {
  id: number
  name: string
  bankName: string
  balance: number
  isActive: boolean
  color: string
  accountType: string
}

interface Expense {
  id: number
  amount: number
  category: string
  expenseDate: string
}

interface Income {
  id: number
  amount: number
  incomeDate: string
}

export function BudgetOverview() {
  const [budgetData, setBudgetData] = useState<BudgetData[]>([])
  const [totalBudget, setTotalBudget] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  const [netCashFlow, setNetCashFlow] = useState(0)
  const [totalBankBalance, setTotalBankBalance] = useState(0)

  const { formatCurrency } = useCurrency()

  // Fetch data from APIs
  const { data: accounts, loading: accountsLoading } = useApi<BankAccount[]>("/api/bank-accounts")
  const { data: expenses, loading: expensesLoading } = useApi<Expense[]>("/api/expenses")
  const { data: income, loading: incomeLoading } = useApi<Income[]>("/api/income")
  const { data: budgets, loading: budgetsLoading } = useApi<any[]>("/api/budgets")

  const loading = accountsLoading || expensesLoading || incomeLoading || budgetsLoading

  useEffect(() => {
    if (!accounts || !expenses || !income || !budgets) return

    // Calculate spending by category
    const spendingByCategory = expenses.reduce((acc: any, expense: any) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount)
      return acc
    }, {})

    // Calculate totals
    const totalIncomeAmount = income.reduce((sum: number, inc: any) => sum + Number(inc.amount), 0)
    const totalSpentAmount = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0)

    // Calculate total bank balance (excluding credit cards)
    const totalBalance = accounts
      .filter((acc: BankAccount) => acc.accountType !== "credit" && acc.isActive)
      .reduce((sum: number, acc: BankAccount) => sum + Number(acc.balance), 0)

    setTotalIncome(totalIncomeAmount)
    setNetCashFlow(totalIncomeAmount - totalSpentAmount)
    setTotalBankBalance(totalBalance)

    // Combine with budget data
    const combinedData = budgets.map((budget: any) => ({
      category: budget.category,
      budget: Number(budget.budgetAmount),
      spent: spendingByCategory[budget.category] || 0,
      color: budget.color,
    }))

    setBudgetData(combinedData)
    setTotalBudget(budgets.reduce((sum: number, b: any) => sum + Number(b.budgetAmount), 0))
    setTotalSpent(totalSpentAmount)
  }, [accounts, expenses, income, budgets])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading overview...</span>
      </div>
    )
  }

  const overBudgetCategories = budgetData.filter((item) => item.spent > item.budget)

  // Group accounts by type
  const bankAccountsOnly = (accounts || []).filter(
    (acc) => acc.accountType === "checking" || acc.accountType === "savings",
  )
  const eWallets = (accounts || []).filter((acc) => acc.accountType === "ewallet")
  const creditCards = (accounts || []).filter((acc) => acc.accountType === "credit")

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Financial Overview</h2>
            <p className="text-blue-100">Track your money flow across Indonesian banks and e-wallets</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <Wallet className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Bank Balance</CardTitle>
            <div className="bg-green-100 p-2 rounded-lg">
              <Wallet className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(totalBankBalance)}</div>
            <p className="text-xs text-green-600 mt-1">Across {(accounts || []).length} accounts</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Income</CardTitle>
            <div className="bg-blue-100 p-2 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-blue-600 mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Total Spent</CardTitle>
            <div className="bg-orange-100 p-2 rounded-lg">
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-orange-600 mt-1">
              {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% of budget` : "No budget set"}
            </p>
          </CardContent>
        </Card>

        <Card
          className={`border-0 shadow-lg ${netCashFlow >= 0 ? "bg-gradient-to-br from-emerald-50 to-green-50" : "bg-gradient-to-br from-red-50 to-pink-50"}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${netCashFlow >= 0 ? "text-emerald-800" : "text-red-800"}`}>
              Net Cash Flow
            </CardTitle>
            <div className={`p-2 rounded-lg ${netCashFlow >= 0 ? "bg-emerald-100" : "bg-red-100"}`}>
              <BarChart3 className={`h-4 w-4 ${netCashFlow >= 0 ? "text-emerald-600" : "text-red-600"}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {formatCurrency(netCashFlow)}
            </div>
            <p className={`text-xs mt-1 ${netCashFlow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {netCashFlow >= 0 ? "Positive cash flow" : "Spending exceeds income"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overBudgetCategories.length > 0 && (
        <Alert className="border-red-200 bg-red-50 shadow-lg">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Budget Alert:</strong> You're over budget in {overBudgetCategories.length} categor
            {overBudgetCategories.length === 1 ? "y" : "ies"}:{" "}
            {overBudgetCategories.map((cat) => cat.category).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Account Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bank Accounts */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Accounts
            </CardTitle>
            <CardDescription className="text-blue-100">{bankAccountsOnly.length} accounts</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {bankAccountsOnly.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No bank accounts added</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bankAccountsOnly.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: account.color }} />
                      <div>
                        <p className="font-medium text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-500">{account.bankName}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">{formatCurrency(Number(account.balance))}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* E-Wallets */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              E-Wallets
            </CardTitle>
            <CardDescription className="text-purple-100">{eWallets.length} wallets</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {eWallets.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No e-wallets added</p>
              </div>
            ) : (
              <div className="space-y-4">
                {eWallets.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: account.color }} />
                      <div>
                        <p className="font-medium text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-500">{account.bankName}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">{formatCurrency(Number(account.balance))}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Cards */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credit Cards
            </CardTitle>
            <CardDescription className="text-orange-100">{creditCards.length} cards</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {creditCards.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No credit cards added</p>
              </div>
            ) : (
              <div className="space-y-4">
                {creditCards.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: account.color }} />
                      <div>
                        <p className="font-medium text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-500">{account.bankName}</p>
                      </div>
                    </div>
                    <span className="font-bold text-orange-600">
                      {Number(account.balance) < 0 ? formatCurrency(Math.abs(Number(account.balance))) : "Available"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Budget Progress
          </CardTitle>
          <CardDescription className="text-indigo-100">Track your spending against monthly budgets</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {budgetData.length === 0 ? (
            <div className="text-center py-12">
              <PieChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No budgets created yet</p>
              <p className="text-sm text-gray-400">Go to the Budget tab to create your first budget</p>
            </div>
          ) : (
            <div className="space-y-6">
              {budgetData.map((item) => {
                const percentage = item.budget > 0 ? (item.spent / item.budget) * 100 : 0
                const isOverBudget = item.spent > item.budget

                return (
                  <div key={item.category} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-gray-900">{item.category}</span>
                        {isOverBudget && (
                          <Badge variant="destructive" className="text-xs">
                            Over Budget
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                        </div>
                        <div className="text-xs text-gray-500">{percentage.toFixed(1)}% used</div>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className="h-3"
                      style={
                        {
                          "--progress-background": isOverBudget ? "#ef4444" : item.color,
                        } as React.CSSProperties
                      }
                    />
                    {isOverBudget && (
                      <p className="text-xs text-red-600">Over budget by {formatCurrency(item.spent - item.budget)}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
