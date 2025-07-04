"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Download, FileText, Calendar } from "lucide-react"
import { useCurrency } from "@/providers/currency-provider"

export function DataExport() {
  const [exportType, setExportType] = useState<"expenses" | "income" | "budgets" | "investments" | "cashflow" | "all">(
    "expenses",
  )
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const { toast } = useToast()
  const { formatCurrency, getCurrencyCode } = useCurrency()

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header.toLowerCase().replace(/\s+/g, "")]
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = () => {
    try {
      switch (exportType) {
        case "expenses":
          exportExpenses()
          break
        case "income":
          exportIncome()
          break
        case "budgets":
          exportBudgets()
          break
        case "investments":
          exportInvestments()
          break
        case "cashflow":
          exportCashFlow()
          break
        case "all":
          exportAll()
          break
      }

      toast({
        title: "Export Successful",
        description: "Your data has been exported to CSV format",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data",
        variant: "destructive",
      })
    }
  }

  const exportExpenses = () => {
    const expenses = JSON.parse(localStorage.getItem("finance-expenses") || "[]")
    let filteredExpenses = expenses

    if (dateFrom || dateTo) {
      filteredExpenses = expenses.filter((expense: any) => {
        const expenseDate = new Date(expense.date)
        const fromDate = dateFrom ? new Date(dateFrom) : new Date("1900-01-01")
        const toDate = dateTo ? new Date(dateTo) : new Date("2100-12-31")
        return expenseDate >= fromDate && expenseDate <= toDate
      })
    }

    const headers = ["Date", "Amount", "Category", "Description", "Tags", "Currency"]
    const data = filteredExpenses.map((expense: any) => ({
      date: expense.date,
      amount: formatCurrency(expense.amount),
      category: expense.category,
      description: expense.description,
      tags: expense.tags.join("; "),
      currency: getCurrencyCode(),
    }))

    exportToCSV(data, "expenses.csv", headers)
  }

  const exportIncome = () => {
    const incomes = JSON.parse(localStorage.getItem("finance-incomes") || "[]")
    let filteredIncomes = incomes

    if (dateFrom || dateTo) {
      filteredIncomes = incomes.filter((income: any) => {
        const incomeDate = new Date(income.date)
        const fromDate = dateFrom ? new Date(dateFrom) : new Date("1900-01-01")
        const toDate = dateTo ? new Date(dateTo) : new Date("2100-12-31")
        return incomeDate >= fromDate && incomeDate <= toDate
      })
    }

    const headers = ["Date", "Amount", "Source", "Category", "Description", "Recurring", "Frequency", "Currency"]
    const data = filteredIncomes.map((income: any) => ({
      date: income.date,
      amount: formatCurrency(income.amount),
      source: income.source,
      category: income.category,
      description: income.description || "",
      recurring: income.isRecurring ? "Yes" : "No",
      frequency: income.frequency || "N/A",
      currency: getCurrencyCode(),
    }))

    exportToCSV(data, "income.csv", headers)
  }

  const exportCashFlow = () => {
    const incomes = JSON.parse(localStorage.getItem("finance-incomes") || "[]")
    const expenses = JSON.parse(localStorage.getItem("finance-expenses") || "[]")

    const totalIncome = incomes.reduce((sum: number, income: any) => sum + income.amount, 0)
    const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)
    const netCashFlow = totalIncome - totalExpenses

    const headers = ["Metric", "Amount", "Percentage", "Currency"]
    const data = [
      { metric: "Total Income", amount: formatCurrency(totalIncome), percentage: "100%", currency: getCurrencyCode() },
      {
        metric: "Total Expenses",
        amount: formatCurrency(totalExpenses),
        percentage: totalIncome > 0 ? `${((totalExpenses / totalIncome) * 100).toFixed(1)}%` : "0%",
        currency: getCurrencyCode(),
      },
      {
        metric: "Net Cash Flow",
        amount: formatCurrency(netCashFlow),
        percentage: `${(totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0).toFixed(1)}%`,
        currency: getCurrencyCode(),
      },
    ]

    exportToCSV(data, "cashflow.csv", headers)
  }

  const exportBudgets = () => {
    const budgets = JSON.parse(localStorage.getItem("finance-budgets") || "[]")
    const expenses = JSON.parse(localStorage.getItem("finance-expenses") || "[]")

    // Calculate spending by category
    const spendingByCategory = expenses.reduce((acc: any, expense: any) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {})

    const headers = ["Category", "Budget", "Spent", "Remaining", "Percentage Used", "Currency"]
    const data = budgets.map((budget: any) => {
      const spent = spendingByCategory[budget.category] || 0
      const remaining = budget.budget - spent
      const percentageUsed = budget.budget > 0 ? (spent / budget.budget) * 100 : 0

      return {
        category: budget.category,
        budget: formatCurrency(budget.budget),
        spent: formatCurrency(spent),
        remaining: formatCurrency(remaining),
        percentageused: `${percentageUsed.toFixed(2)}%`,
        currency: getCurrencyCode(),
      }
    })

    exportToCSV(data, "budgets.csv", headers)
  }

  const exportInvestments = () => {
    const investments = JSON.parse(localStorage.getItem("finance-investments") || "[]")

    const headers = [
      "Symbol",
      "Name",
      "Type",
      "Quantity",
      "Purchase Price",
      "Current Price",
      "Purchase Date",
      "Current Value",
      "Gain/Loss",
      "Gain/Loss %",
      "Currency",
    ]
    const data = investments.map((investment: any) => {
      const currentValue = investment.currentPrice * investment.quantity
      const investedValue = investment.purchasePrice * investment.quantity
      const gainLoss = currentValue - investedValue
      const gainLossPercent = investedValue > 0 ? (gainLoss / investedValue) * 100 : 0

      return {
        symbol: investment.symbol,
        name: investment.name,
        type: investment.type,
        quantity: investment.quantity,
        purchaseprice: formatCurrency(investment.purchasePrice),
        currentprice: formatCurrency(investment.currentPrice),
        purchasedate: investment.purchaseDate,
        currentvalue: formatCurrency(currentValue),
        gainloss: formatCurrency(gainLoss),
        gainlosspercent: `${gainLossPercent.toFixed(2)}%`,
        currency: getCurrencyCode(),
      }
    })

    exportToCSV(data, "investments.csv", headers)
  }

  const exportAll = () => {
    exportExpenses()
    exportIncome()
    exportBudgets()
    exportInvestments()
    exportCashFlow()
  }

  const getDataCount = (type: string) => {
    switch (type) {
      case "expenses":
        return JSON.parse(localStorage.getItem("finance-expenses") || "[]").length
      case "income":
        return JSON.parse(localStorage.getItem("finance-incomes") || "[]").length
      case "budgets":
        return JSON.parse(localStorage.getItem("finance-budgets") || "[]").length
      case "investments":
        return JSON.parse(localStorage.getItem("finance-investments") || "[]").length
      default:
        return 0
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Export Data</h2>
        <p className="text-muted-foreground">Download your financial data in CSV format</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
            <CardDescription>Choose what data to export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exportType">Data Type</Label>
              <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expenses">Expenses ({getDataCount("expenses")} records)</SelectItem>
                  <SelectItem value="income">Income ({getDataCount("income")} sources)</SelectItem>
                  <SelectItem value="budgets">Budgets ({getDataCount("budgets")} categories)</SelectItem>
                  <SelectItem value="investments">Investments ({getDataCount("investments")} holdings)</SelectItem>
                  <SelectItem value="cashflow">Cash Flow Analysis</SelectItem>
                  <SelectItem value="all">All Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(exportType === "expenses" || exportType === "income") && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">From Date</Label>
                    <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo">To Date</Label>
                    <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleExport} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          </CardContent>
        </Card>

        {/* Export Information */}
        <Card>
          <CardHeader>
            <CardTitle>Export Information</CardTitle>
            <CardDescription>What's included in each export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Expenses</h4>
                  <p className="text-sm text-muted-foreground">
                    Date, amount, category, description, and tags for all expenses
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Income</h4>
                  <p className="text-sm text-muted-foreground">
                    Income sources, amounts, categories, and recurring status
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Budgets</h4>
                  <p className="text-sm text-muted-foreground">
                    Budget limits, actual spending, and usage percentages by category
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Investments</h4>
                  <p className="text-sm text-muted-foreground">
                    Portfolio details including gains/losses and current values
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Cash Flow</h4>
                  <p className="text-sm text-muted-foreground">
                    Summary of income vs expenses with savings rate analysis
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Date Filtering</h4>
                  <p className="text-sm text-muted-foreground">Filter expenses by date range for targeted exports</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
