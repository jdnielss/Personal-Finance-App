"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { PieChart, BarChart3, TrendingUp, TrendingDown, Calendar, Target } from "lucide-react"
import { useCurrency } from "./currency-provider"

interface ExpenseData {
  category: string
  amount: number
  count: number
  percentage: number
  color: string
  trend: "up" | "down" | "stable"
  avgAmount: number
}

interface MonthlyData {
  month: string
  categories: { [key: string]: number }
  total: number
}

const CATEGORY_COLORS: { [key: string]: string } = {
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

export function ExpenseAnalytics() {
  const [timeframe, setTimeframe] = useState<"1month" | "3months" | "6months" | "1year">("3months")
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [topCategory, setTopCategory] = useState<ExpenseData | null>(null)
  const [avgMonthlySpending, setAvgMonthlySpending] = useState(0)

  const { formatCurrency } = useCurrency()

  useEffect(() => {
    calculateAnalytics()
  }, [timeframe])

  const calculateAnalytics = () => {
    const expenses = JSON.parse(localStorage.getItem("finance-expenses") || "[]")
    const budgets = JSON.parse(localStorage.getItem("finance-budgets") || "[]")

    // Filter expenses by timeframe
    const now = new Date()
    const monthsBack = timeframe === "1month" ? 1 : timeframe === "3months" ? 3 : timeframe === "6months" ? 6 : 12
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)

    const filteredExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= startDate
    })

    // Calculate category data
    const categoryStats: { [key: string]: { amount: number; count: number; dates: string[] } } = {}

    filteredExpenses.forEach((expense: any) => {
      if (!categoryStats[expense.category]) {
        categoryStats[expense.category] = { amount: 0, count: 0, dates: [] }
      }
      categoryStats[expense.category].amount += expense.amount
      categoryStats[expense.category].count += 1
      categoryStats[expense.category].dates.push(expense.date)
    })

    const total = Object.values(categoryStats).reduce((sum: number, cat: any) => sum + cat.amount, 0)
    setTotalExpenses(total)

    // Create expense data with trends
    const expenseAnalytics: ExpenseData[] = Object.entries(categoryStats).map(([category, stats]: [string, any]) => {
      const percentage = total > 0 ? (stats.amount / total) * 100 : 0
      const avgAmount = stats.count > 0 ? stats.amount / stats.count : 0

      // Calculate trend (compare first half vs second half of period)
      const midPoint = new Date(startDate.getTime() + (now.getTime() - startDate.getTime()) / 2)
      const firstHalf = stats.dates.filter((date: string) => new Date(date) < midPoint).length
      const secondHalf = stats.dates.filter((date: string) => new Date(date) >= midPoint).length

      let trend: "up" | "down" | "stable" = "stable"
      if (secondHalf > firstHalf * 1.2) trend = "up"
      else if (firstHalf > secondHalf * 1.2) trend = "down"

      return {
        category,
        amount: stats.amount,
        count: stats.count,
        percentage,
        color: CATEGORY_COLORS[category] || "#6b7280",
        trend,
        avgAmount,
      }
    })

    // Sort by amount
    expenseAnalytics.sort((a, b) => b.amount - a.amount)
    setExpenseData(expenseAnalytics)
    setTopCategory(expenseAnalytics[0] || null)

    // Calculate monthly data
    const monthlyStats: { [key: string]: { [key: string]: number } } = {}
    const monthlyTotals: { [key: string]: number } = {}

    filteredExpenses.forEach((expense: any) => {
      const date = new Date(expense.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {}
        monthlyTotals[monthKey] = 0
      }

      if (!monthlyStats[monthKey][expense.category]) {
        monthlyStats[monthKey][expense.category] = 0
      }

      monthlyStats[monthKey][expense.category] += expense.amount
      monthlyTotals[monthKey] += expense.amount
    })

    const monthlyAnalytics: MonthlyData[] = Object.entries(monthlyStats).map(([month, categories]) => ({
      month: new Date(month + "-01").toLocaleDateString("id-ID", { month: "short", year: "numeric" }),
      categories: categories as { [key: string]: number },
      total: monthlyTotals[month],
    }))

    monthlyAnalytics.sort((a, b) => a.month.localeCompare(b.month))
    setMonthlyData(monthlyAnalytics)

    // Calculate average monthly spending
    const avgSpending =
      monthlyAnalytics.length > 0
        ? monthlyAnalytics.reduce((sum, month) => sum + month.total, 0) / monthlyAnalytics.length
        : 0
    setAvgMonthlySpending(avgSpending)
  }

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case "1month":
        return "Last Month"
      case "3months":
        return "Last 3 Months"
      case "6months":
        return "Last 6 Months"
      case "1year":
        return "Last Year"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Expense Analytics</h2>
            <p className="text-indigo-100">Analyze your spending patterns and trends</p>
          </div>
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-40 bg-white text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total Expenses</CardTitle>
            <div className="bg-red-100 p-2 rounded-lg">
              <BarChart3 className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-red-600 mt-1">{getTimeframeLabel()}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Avg Monthly</CardTitle>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatCurrency(avgMonthlySpending)}</div>
            <p className="text-xs text-blue-600 mt-1">Average per month</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Top Category</CardTitle>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Target className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-700">{topCategory?.category || "N/A"}</div>
            <p className="text-xs text-purple-600 mt-1">
              {topCategory ? `${topCategory.percentage.toFixed(1)}% of spending` : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Categories</CardTitle>
            <div className="bg-green-100 p-2 rounded-lg">
              <PieChart className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{expenseData.length}</div>
            <p className="text-xs text-green-600 mt-1">Active categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-indigo-600" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseData.length === 0 ? (
              <div className="text-center py-8">
                <PieChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No expense data for selected period</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenseData.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium">{item.category}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.trend === "up" && <TrendingUp className="h-3 w-3 mr-1 text-red-500" />}
                          {item.trend === "down" && <TrendingDown className="h-3 w-3 mr-1 text-green-500" />}
                          {item.count} transactions
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(item.amount)}</div>
                        <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                    <div className="text-xs text-gray-500">
                      Average: {formatCurrency(item.avgAmount)} per transaction
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Monthly Spending Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No monthly data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyData.map((month, index) => {
                  const maxAmount = Math.max(...monthlyData.map((m) => m.total))
                  const barWidth = maxAmount > 0 ? (month.total / maxAmount) * 100 : 0

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{month.month}</span>
                        <span className="font-bold">{formatCurrency(month.total)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(month.categories).map(([category, amount]) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}: {formatCurrency(amount as number)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Insights */}
      {expenseData.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Spending Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-green-800">Highest Spending</h4>
                <div className="text-2xl font-bold text-green-700">{topCategory?.category}</div>
                <p className="text-sm text-green-600">
                  {topCategory && formatCurrency(topCategory.amount)} ({topCategory?.percentage.toFixed(1)}%)
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-blue-800">Most Frequent</h4>
                <div className="text-2xl font-bold text-blue-700">
                  {expenseData.reduce((max, cat) => (cat.count > max.count ? cat : max), expenseData[0])?.category}
                </div>
                <p className="text-sm text-blue-600">
                  {expenseData.reduce((max, cat) => (cat.count > max.count ? cat : max), expenseData[0])?.count}{" "}
                  transactions
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-purple-800">Highest Average</h4>
                <div className="text-2xl font-bold text-purple-700">
                  {
                    expenseData.reduce((max, cat) => (cat.avgAmount > max.avgAmount ? cat : max), expenseData[0])
                      ?.category
                  }
                </div>
                <p className="text-sm text-purple-600">
                  {formatCurrency(
                    expenseData.reduce((max, cat) => (cat.avgAmount > max.avgAmount ? cat : max), expenseData[0])
                      ?.avgAmount || 0,
                  )}{" "}
                  avg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
