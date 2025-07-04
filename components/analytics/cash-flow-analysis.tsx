"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Target, PieChart, BarChart3, Loader2 } from "lucide-react"
import { useCurrency } from "./currency-provider"
import { useApi } from "@/hooks/use-api"

interface CashFlowData {
  month: string
  income: number
  expenses: number
  netFlow: number
  year: number
  monthNumber: number
}

interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  color: string
}

interface Income {
  id: number
  amount: number
  category: string
  date: string
  isRecurring: boolean
  frequency?: string
}

interface Expense {
  id: number
  amount: number
  category: string
  expenseDate: string
}

export function CashFlowAnalysis() {
  const [timeframe, setTimeframe] = useState<"3months" | "6months" | "12months">("6months")
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([])
  const [incomeBreakdown, setIncomeBreakdown] = useState<CategoryBreakdown[]>([])
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [netCashFlow, setNetCashFlow] = useState(0)
  const [savingsRate, setSavingsRate] = useState(0)

  const { formatCurrency } = useCurrency()

  const { data: incomes, loading: incomesLoading } = useApi<Income[]>("/api/income")
  const { data: expenses, loading: expensesLoading } = useApi<Expense[]>("/api/expenses")

  const loading = incomesLoading || expensesLoading

  useEffect(() => {
    if (!incomes || !expenses) return
    calculateCashFlow()
  }, [timeframe, incomes, expenses])

  const calculateCashFlow = () => {
    if (!incomes || !expenses) return

    // Calculate totals
    const totalIncomeAmount = incomes.reduce((sum: number, income: any) => sum + Number(income.amount), 0)
    const totalExpenseAmount = expenses.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0)
    const netFlow = totalIncomeAmount - totalExpenseAmount
    const savingsRateCalc = totalIncomeAmount > 0 ? (netFlow / totalIncomeAmount) * 100 : 0

    setTotalIncome(totalIncomeAmount)
    setTotalExpenses(totalExpenseAmount)
    setNetCashFlow(netFlow)
    setSavingsRate(savingsRateCalc)

    // Calculate income breakdown by category
    const incomeByCategory = incomes.reduce((acc: any, income: any) => {
      acc[income.category] = (acc[income.category] || 0) + Number(income.amount)
      return acc
    }, {})

    const incomeBreakdownData = Object.entries(incomeByCategory).map(([category, amount]: [string, any]) => ({
      category,
      amount,
      percentage: totalIncomeAmount > 0 ? (amount / totalIncomeAmount) * 100 : 0,
      color: getIncomeColor(category),
    }))

    setIncomeBreakdown(incomeBreakdownData.sort((a, b) => b.amount - a.amount))

    // Calculate expense breakdown by category
    const expenseByCategory = expenses.reduce((acc: any, expense: any) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount)
      return acc
    }, {})

    const expenseBreakdownData = Object.entries(expenseByCategory).map(([category, amount]: [string, any]) => ({
      category,
      amount,
      percentage: totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0,
      color: getExpenseColor(category),
    }))

    setExpenseBreakdown(expenseBreakdownData.sort((a, b) => b.amount - a.amount))

    // Calculate real monthly cash flow data
    const monthlyData = calculateMonthlyData(incomes, expenses, timeframe)
    setCashFlowData(monthlyData)
  }

  const calculateMonthlyData = (incomes: any[], expenses: any[], timeframe: string): CashFlowData[] => {
    const monthCount = timeframe === "3months" ? 3 : timeframe === "6months" ? 6 : 12
    const now = new Date()
    const monthlyData: CashFlowData[] = []

    // Generate months for the timeframe
    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth()
      const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

      // Calculate income for this month
      const monthlyIncome = incomes
        .filter((income: any) => {
          const incomeDate = new Date(income.date)
          return incomeDate.getFullYear() === year && incomeDate.getMonth() === month
        })
        .reduce((sum: number, income: any) => sum + Number(income.amount), 0)

      // Calculate expenses for this month
      const monthlyExpenses = expenses
        .filter((expense: any) => {
          const expenseDate = new Date(expense.expenseDate)
          return expenseDate.getFullYear() === year && expenseDate.getMonth() === month
        })
        .reduce((sum: number, expense: any) => sum + Number(expense.amount), 0)

      // Add recurring income for this month
      const recurringIncome = calculateRecurringIncomeForMonth(incomes, year, month)

      const totalMonthlyIncome = monthlyIncome + recurringIncome
      const netFlow = totalMonthlyIncome - monthlyExpenses

      monthlyData.push({
        month: monthName,
        income: totalMonthlyIncome,
        expenses: monthlyExpenses,
        netFlow: netFlow,
        year: year,
        monthNumber: month,
      })
    }

    return monthlyData
  }

  const calculateRecurringIncomeForMonth = (incomes: any[], year: number, month: number): number => {
    const recurringIncomes = incomes.filter((income: any) => income.isRecurring)
    let totalRecurring = 0

    recurringIncomes.forEach((income: any) => {
      const incomeDate = new Date(income.date)
      const incomeYear = incomeDate.getFullYear()
      const incomeMonth = incomeDate.getMonth()

      // Check if this recurring income should be counted for this month
      if (year > incomeYear || (year === incomeYear && month >= incomeMonth)) {
        switch (income.frequency) {
          case "weekly":
            // Count weeks in the month
            const weeksInMonth = getWeeksInMonth(year, month)
            totalRecurring += Number(income.amount) * weeksInMonth
            break
          case "bi-weekly":
            // Approximately 2.17 bi-weeks per month
            totalRecurring += Number(income.amount) * 2.17
            break
          case "monthly":
            totalRecurring += Number(income.amount)
            break
          case "quarterly":
            // Only add if this month is a quarter month for this income
            if (isQuarterMonth(incomeDate, new Date(year, month, 1))) {
              totalRecurring += Number(income.amount)
            }
            break
          case "yearly":
            // Only add if this month matches the income month
            if (month === incomeMonth) {
              totalRecurring += Number(income.amount)
            }
            break
        }
      }
    })

    return totalRecurring
  }

  const getWeeksInMonth = (year: number, month: number): number => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = lastDay.getDate()
    return Math.ceil(days / 7)
  }

  const isQuarterMonth = (startDate: Date, checkDate: Date): boolean => {
    const startMonth = startDate.getMonth()
    const checkMonth = checkDate.getMonth()
    const monthDiff = (checkDate.getFullYear() - startDate.getFullYear()) * 12 + (checkMonth - startMonth)
    return monthDiff >= 0 && monthDiff % 3 === 0
  }

  const getIncomeColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      Salary: "#10b981",
      Freelance: "#3b82f6",
      Business: "#8b5cf6",
      Investments: "#f59e0b",
      Rental: "#ef4444",
      "Side Hustle": "#06b6d4",
      Bonus: "#84cc16",
      Gift: "#ec4899",
      Refund: "#6b7280",
      Other: "#64748b",
    }
    return colors[category] || "#6b7280"
  }

  const getExpenseColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      "Food & Dining": "#ef4444",
      Transportation: "#3b82f6",
      Shopping: "#8b5cf6",
      Entertainment: "#f59e0b",
      "Bills & Utilities": "#10b981",
      Healthcare: "#ec4899",
      Travel: "#06b6d4",
      Education: "#84cc16",
      Other: "#6b7280",
    }
    return colors[category] || "#6b7280"
  }

  const getSavingsRateStatus = () => {
    if (savingsRate >= 20) return { status: "excellent", color: "text-green-600", message: "Excellent savings rate!" }
    if (savingsRate >= 10) return { status: "good", color: "text-blue-600", message: "Good savings rate" }
    if (savingsRate >= 0) return { status: "fair", color: "text-yellow-600", message: "Consider increasing savings" }
    return { status: "poor", color: "text-red-600", message: "Spending exceeds income" }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading cash flow analysis...</span>
      </div>
    )
  }

  const savingsStatus = getSavingsRateStatus()

  // Calculate average monthly values
  const avgMonthlyIncome =
    cashFlowData.length > 0 ? cashFlowData.reduce((sum, data) => sum + data.income, 0) / cashFlowData.length : 0
  const avgMonthlyExpenses =
    cashFlowData.length > 0 ? cashFlowData.reduce((sum, data) => sum + data.expenses, 0) / cashFlowData.length : 0
  const avgMonthlySavings = avgMonthlyIncome - avgMonthlyExpenses

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Cash Flow Analysis</h2>
          <p className="text-muted-foreground">Track your income vs expenses and financial health</p>
        </div>
        <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="12months">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(avgMonthlyIncome)}</div>
            <p className="text-xs text-muted-foreground">Average per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(avgMonthlyExpenses)}</div>
            <p className="text-xs text-muted-foreground">Average per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Monthly Savings</CardTitle>
            <DollarSign className={`h-4 w-4 ${avgMonthlySavings >= 0 ? "text-green-600" : "text-red-600"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgMonthlySavings >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(avgMonthlySavings)}
            </div>
            <p className="text-xs text-muted-foreground">
              {avgMonthlySavings >= 0 ? "Positive cash flow" : "Negative cash flow"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <Target className={`h-4 w-4 ${savingsStatus.color.replace("text-", "text-")}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${savingsStatus.color}`}>
              {avgMonthlyIncome > 0 ? ((avgMonthlySavings / avgMonthlyIncome) * 100).toFixed(1) : "0"}%
            </div>
            <p className={`text-xs ${savingsStatus.color}`}>{savingsStatus.message}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {avgMonthlySavings < 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Your average monthly expenses exceed your income by {formatCurrency(Math.abs(avgMonthlySavings))}. Consider
            reviewing your spending or increasing your income.
          </AlertDescription>
        </Alert>
      )}

      {avgMonthlyIncome > 0 && (avgMonthlySavings / avgMonthlyIncome) * 100 < 10 && avgMonthlySavings >= 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Your average savings rate is below 10%. Financial experts recommend saving at least 10-20% of your income.
          </AlertDescription>
        </Alert>
      )}

      {/* Cash Flow Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Cash Flow Trend
          </CardTitle>
          <CardDescription>
            Actual monthly income vs expenses {cashFlowData.length > 0 && `(${cashFlowData.length} months)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cashFlowData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No data available for the selected timeframe.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add some income and expenses to see your cash flow trend.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cashFlowData.map((data, index) => {
                const maxAmount = Math.max(data.income, data.expenses)
                const incomeWidth = maxAmount > 0 ? (data.income / maxAmount) * 100 : 0
                const expenseWidth = maxAmount > 0 ? (data.expenses / maxAmount) * 100 : 0

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{data.month}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600">+{formatCurrency(data.income)}</span>
                        <span className="text-red-600">-{formatCurrency(data.expenses)}</span>
                        <span className={`font-medium ${data.netFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {data.netFlow >= 0 ? "+" : ""}
                          {formatCurrency(data.netFlow)}
                        </span>
                      </div>
                    </div>

                    {/* Income Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Income</span>
                        <span>{formatCurrency(data.income)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${incomeWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* Expense Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Expenses</span>
                        <span>{formatCurrency(data.expenses)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${expenseWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* Net Flow Indicator */}
                    <div className="flex items-center justify-center">
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          data.netFlow >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        Net: {data.netFlow >= 0 ? "+" : ""}
                        {formatCurrency(data.netFlow)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Income vs Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-600" />
              Income Breakdown
            </CardTitle>
            <CardDescription>Income by category (all time)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {incomeBreakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No income data available</p>
            ) : (
              incomeBreakdown.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                      <span className="text-muted-foreground ml-2">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-red-600" />
              Expense Breakdown
            </CardTitle>
            <CardDescription>Expenses by category (all time)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {expenseBreakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No expense data available</p>
            ) : (
              expenseBreakdown.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                      <span className="text-muted-foreground ml-2">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Insights</CardTitle>
          <CardDescription>Key metrics and recommendations based on your actual data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Monthly Expense Ratio</h4>
              <div className="text-2xl font-bold">
                {avgMonthlyIncome > 0 ? ((avgMonthlyExpenses / avgMonthlyIncome) * 100).toFixed(1) : "0"}%
              </div>
              <p className="text-sm text-muted-foreground">of income spent monthly</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Best Month</h4>
              <div className="text-2xl font-bold">
                {cashFlowData.length > 0
                  ? cashFlowData.reduce((best, current) => (current.netFlow > best.netFlow ? current : best)).month
                  : "N/A"}
              </div>
              <p className="text-sm text-muted-foreground">
                {cashFlowData.length > 0
                  ? `${formatCurrency(cashFlowData.reduce((best, current) => (current.netFlow > best.netFlow ? current : best)).netFlow)} saved`
                  : "No data"}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Trend</h4>
              <div className="text-2xl font-bold">
                {cashFlowData.length >= 2
                  ? cashFlowData[cashFlowData.length - 1].netFlow > cashFlowData[0].netFlow
                    ? "Improving"
                    : "Declining"
                  : "N/A"}
              </div>
              <p className="text-sm text-muted-foreground">
                {cashFlowData.length >= 2
                  ? `${cashFlowData[cashFlowData.length - 1].netFlow > cashFlowData[0].netFlow ? "↗" : "↘"} vs first month`
                  : "Need more data"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
