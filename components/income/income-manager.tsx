"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, DollarSign, Calendar, Repeat, CreditCard, TrendingUp, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { CurrencyInput } from "@/components/ui/currency-input"
import { useCurrency } from "@/providers/currency-provider"
import { useApi, apiCall } from "@/hooks/use-api"
import { INCOME_CATEGORIES, FREQUENCY_OPTIONS, CATEGORY_COLORS } from "@/lib/constants"

interface Income {
  id: number
  amount: number
  source: string
  category: string
  description: string
  date: string
  isRecurring: boolean
  frequency?: "weekly" | "bi-weekly" | "monthly" | "quarterly" | "yearly"
  nextDate?: string
  bankAccountId?: number
  bankAccountName?: string
}

interface BankAccount {
  id: number
  name: string
  bankName: string
  balance: number
  isActive: boolean
  color: string
}

export function IncomeManager() {
  const [isAddingIncome, setIsAddingIncome] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()

  const {
    data: incomes,
    loading: incomesLoading,
    error: incomesError,
    refetch: refetchIncomes,
  } = useApi<Income[]>("/api/income")
  const { data: bankAccounts, loading: accountsLoading } = useApi<BankAccount[]>("/api/bank-accounts")

  const loading = incomesLoading || accountsLoading

  const addIncome = async (incomeData: Omit<Income, "id">) => {
    try {
      await apiCall("/api/income", {
        method: "POST",
        body: {
          amount: incomeData.amount,
          source: incomeData.source,
          category: incomeData.category,
          description: incomeData.description,
          date: incomeData.date,
          isRecurring: incomeData.isRecurring,
          frequency: incomeData.frequency,
          nextDate: incomeData.nextDate,
          bankAccountId: incomeData.bankAccountId,
        },
      })

      await refetchIncomes()
      setIsAddingIncome(false)
      toast({
        title: "Income Added",
        description: `Added ${incomeData.category} income of ${formatCurrency(incomeData.amount)}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add income",
        variant: "destructive",
      })
    }
  }

  const updateIncome = async (updatedIncome: Income) => {
    try {
      const originalIncome = incomes?.find((inc) => inc.id === updatedIncome.id)

      await apiCall("/api/income", {
        method: "PUT",
        body: {
          id: updatedIncome.id,
          amount: updatedIncome.amount,
          source: updatedIncome.source,
          category: updatedIncome.category,
          description: updatedIncome.description,
          date: updatedIncome.date,
          isRecurring: updatedIncome.isRecurring,
          frequency: updatedIncome.frequency,
          nextDate: updatedIncome.nextDate,
          bankAccountId: updatedIncome.bankAccountId,
          originalAmount: originalIncome?.amount,
          originalBankAccountId: originalIncome?.bankAccountId,
        },
      })

      await refetchIncomes()
      setEditingIncome(null)
      toast({
        title: "Income Updated",
        description: "Income has been successfully updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update income",
        variant: "destructive",
      })
    }
  }

  const deleteIncome = async (id: number) => {
    try {
      await apiCall(`/api/income?id=${id}`, {
        method: "DELETE",
      })

      await refetchIncomes()
      toast({
        title: "Income Deleted",
        description: "Income has been removed and balance adjusted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete income",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading income...</span>
      </div>
    )
  }

  if (incomesError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading income: {incomesError}</p>
        <Button onClick={refetchIncomes} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  const incomeList = incomes || []
  const activeAccounts = (bankAccounts || []).filter((acc) => acc.isActive)
  const totalIncome = incomeList.reduce((sum, inc) => sum + Number(inc.amount), 0)
  const recurringIncome = incomeList.filter((inc) => inc.isRecurring).reduce((sum, inc) => sum + Number(inc.amount), 0)
  const oneTimeIncome = incomeList.filter((inc) => !inc.isRecurring).reduce((sum, inc) => sum + Number(inc.amount), 0)

  const monthlyRecurringIncome = incomeList
    .filter((inc) => inc.isRecurring)
    .reduce((sum, inc) => {
      let monthlyAmount = Number(inc.amount)
      switch (inc.frequency) {
        case "weekly":
          monthlyAmount = Number(inc.amount) * 4.33
          break
        case "bi-weekly":
          monthlyAmount = Number(inc.amount) * 2.17
          break
        case "quarterly":
          monthlyAmount = Number(inc.amount) / 3
          break
        case "yearly":
          monthlyAmount = Number(inc.amount) / 12
          break
        default:
          monthlyAmount = Number(inc.amount)
      }
      return sum + monthlyAmount
    }, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">{incomeList.length} income sources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(monthlyRecurringIncome)}</div>
            <p className="text-xs text-muted-foreground">Estimated monthly</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurring Income</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(recurringIncome)}</div>
            <p className="text-xs text-muted-foreground">
              {incomeList.filter((inc) => inc.isRecurring).length} recurring sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">One-time Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(oneTimeIncome)}</div>
            <p className="text-xs text-muted-foreground">
              {incomeList.filter((inc) => !inc.isRecurring).length} one-time sources
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Income Sources</h2>
          <p className="text-muted-foreground">Track your income and deposit to bank accounts</p>
        </div>
        <Dialog open={isAddingIncome} onOpenChange={setIsAddingIncome}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Income</DialogTitle>
              <DialogDescription>Enter the details of your income source</DialogDescription>
            </DialogHeader>
            <IncomeForm onSubmit={addIncome} bankAccounts={activeAccounts} />
          </DialogContent>
        </Dialog>
      </div>

      {activeAccounts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Account Balances</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {activeAccounts.map((account) => (
                <div key={account.id} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{account.name}</p>
                    <p className="text-xs text-green-600">{formatCurrency(Number(account.balance))}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {incomeList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No income sources recorded yet</p>
              <Button onClick={() => setIsAddingIncome(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Income Source
              </Button>
            </CardContent>
          </Card>
        ) : (
          incomeList.map((income) => {
            const account = activeAccounts.find((acc) => acc.id === income.bankAccountId)

            return (
              <Card key={income.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[income.category] || "#6b7280" }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{income.source}</p>
                        {income.isRecurring && (
                          <Badge variant="secondary" className="text-xs">
                            <Repeat className="h-3 w-3 mr-1" />
                            {FREQUENCY_OPTIONS.find((f) => f.value === income.frequency)?.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{income.category}</span>
                        <span>•</span>
                        <span>{new Date(income.date).toLocaleDateString()}</span>
                        {account && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              <span>{account.name}</span>
                            </div>
                          </>
                        )}
                      </div>
                      {income.description && <p className="text-xs text-muted-foreground mt-1">{income.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <span className="font-bold text-lg text-green-600">{formatCurrency(Number(income.amount))}</span>
                      {account && (
                        <p className="text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          Deposited to {account.name}
                        </p>
                      )}
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Income</DialogTitle>
                        </DialogHeader>
                        <IncomeForm income={income} onSubmit={updateIncome} bankAccounts={activeAccounts} />
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => deleteIncome(income.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

interface IncomeFormProps {
  income?: Income
  onSubmit: (income: Income | Omit<Income, "id">) => void
  bankAccounts: BankAccount[]
}

function IncomeForm({ income, onSubmit, bankAccounts }: IncomeFormProps) {
  const [amount, setAmount] = useState(income?.amount.toString() || "")
  const [source, setSource] = useState(income?.source || "")
  const [category, setCategory] = useState(income?.category || "")
  const [description, setDescription] = useState(income?.description || "")
  const [date, setDate] = useState(income?.date || new Date().toISOString().split("T")[0])
  const [isRecurring, setIsRecurring] = useState(income?.isRecurring || false)
  const [frequency, setFrequency] = useState(income?.frequency || "monthly")
  const [bankAccountId, setBankAccountId] = useState(income?.bankAccountId?.toString() || "")
  const { formatCurrency } = useCurrency()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const incomeData = {
      amount: Number.parseFloat(amount),
      source,
      category,
      description,
      date,
      isRecurring,
      frequency: isRecurring ? (frequency as Income["frequency"]) : undefined,
      nextDate: isRecurring ? calculateNextDate(date, frequency as Income["frequency"]) : undefined,
      bankAccountId: bankAccountId ? Number.parseInt(bankAccountId) : undefined,
    }

    if (income) {
      onSubmit({ ...income, ...incomeData })
    } else {
      onSubmit(incomeData)
    }
  }

  const calculateNextDate = (currentDate: string, freq: Income["frequency"]): string => {
    const date = new Date(currentDate)
    switch (freq) {
      case "weekly":
        date.setDate(date.getDate() + 7)
        break
      case "bi-weekly":
        date.setDate(date.getDate() + 14)
        break
      case "monthly":
        date.setMonth(date.getMonth() + 1)
        break
      case "quarterly":
        date.setMonth(date.getMonth() + 3)
        break
      case "yearly":
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    return date.toISOString().split("T")[0]
  }

  const selectedAccount = bankAccounts.find((acc) => acc.id === Number.parseInt(bankAccountId))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (IDR)</Label>
          <CurrencyInput id="amount" value={amount} onChange={setAmount} placeholder="0.00" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankAccount">Deposit To Account</Label>
        <Select
          value={bankAccountId || "none"}
          onValueChange={(value) => setBankAccountId(value === "none" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select account to deposit (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No specific account</SelectItem>
            {bankAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id.toString()}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                  <span>{account.name}</span>
                  <span className="text-muted-foreground">({account.bankName})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedAccount && (
          <p className="text-xs text-muted-foreground">
            Current balance:{" "}
            <span className="text-green-600 font-medium">{formatCurrency(Number(selectedAccount.balance))}</span>
            {" → "}
            <span className="text-blue-600 font-medium">
              {formatCurrency(Number(selectedAccount.balance) + Number.parseFloat(amount || "0"))}
            </span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">Income Source</Label>
        <Input
          id="source"
          placeholder="e.g., ABC Company, Freelance Client"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {INCOME_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          placeholder="Additional details about this income"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="recurring" checked={isRecurring} onCheckedChange={(checked) => setIsRecurring(!!checked)} />
        <Label htmlFor="recurring">This is recurring income</Label>
      </div>

      {isRecurring && (
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((freq) => (
                <SelectItem key={freq.value} value={freq.value}>
                  {freq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full">
        {income ? "Update Income" : "Add Income"}
      </Button>
    </form>
  )
}
