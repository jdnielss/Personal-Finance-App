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
import { Plus, Edit, Trash2, Tag, CreditCard, Wallet, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CurrencyInput } from "@/components/ui/currency-input"
import { useCurrency } from "@/providers/currency-provider"
import { useApi, apiCall } from "@/hooks/use-api"
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from "@/lib/constants"

interface Expense {
  id: number
  amount: number
  category: string
  description: string
  expenseDate: string
  tags: string[]
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

export function ExpenseManager() {
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()

  const {
    data: expenses,
    loading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useApi<Expense[]>("/api/expenses")
  const { data: bankAccounts, loading: accountsLoading } = useApi<BankAccount[]>("/api/bank-accounts")

  const loading = expensesLoading || accountsLoading

  const addExpense = async (expenseData: Omit<Expense, "id">) => {
    try {
      await apiCall("/api/expenses", {
        method: "POST",
        body: {
          amount: expenseData.amount,
          category: expenseData.category,
          description: expenseData.description,
          date: expenseData.expenseDate,
          tags: expenseData.tags,
          bankAccountId: expenseData.bankAccountId,
        },
      })

      await refetchExpenses()
      setIsAddingExpense(false)
      toast({
        title: "Expense Added",
        description: `Added ${expenseData.category} expense of ${formatCurrency(expenseData.amount)}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      })
    }
  }

  const updateExpense = async (updatedExpense: Expense) => {
    try {
      const originalExpense = expenses?.find((exp) => exp.id === updatedExpense.id)

      await apiCall("/api/expenses", {
        method: "PUT",
        body: {
          id: updatedExpense.id,
          amount: updatedExpense.amount,
          category: updatedExpense.category,
          description: updatedExpense.description,
          date: updatedExpense.expenseDate,
          tags: updatedExpense.tags,
          bankAccountId: updatedExpense.bankAccountId,
          originalAmount: originalExpense?.amount,
          originalBankAccountId: originalExpense?.bankAccountId,
        },
      })

      await refetchExpenses()
      setEditingExpense(null)
      toast({
        title: "Expense Updated",
        description: "Expense has been successfully updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      })
    }
  }

  const deleteExpense = async (id: number) => {
    try {
      await apiCall(`/api/expenses?id=${id}`, {
        method: "DELETE",
      })

      await refetchExpenses()
      toast({
        title: "Expense Deleted",
        description: "Expense has been removed and balance restored",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading expenses...</span>
      </div>
    )
  }

  if (expensesError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading expenses: {expensesError}</p>
        <Button onClick={refetchExpenses} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  const expenseList = expenses || []
  const activeAccounts = (bankAccounts || []).filter((acc) => acc.isActive)
  const totalExpenses = expenseList.reduce((sum, exp) => sum + Number(exp.amount), 0)

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Expense Tracker</h2>
            <p className="text-red-100">
              Total: {formatCurrency(totalExpenses)} ({expenseList.length} transactions)
            </p>
          </div>
          <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
            <DialogTrigger asChild>
              <Button className="bg-white text-red-600 hover:bg-red-50">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Enter the details of your expense</DialogDescription>
              </DialogHeader>
              <ExpenseForm onSubmit={addExpense} bankAccounts={activeAccounts} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {activeAccounts.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              Account Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeAccounts.map((account) => (
                <div key={account.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{account.name}</p>
                    <p className="text-xs text-green-600 font-medium">{formatCurrency(Number(account.balance))}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {expenseList.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wallet className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4 text-lg">No expenses recorded yet</p>
              <Button onClick={() => setIsAddingExpense(true)} className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          expenseList.map((expense) => {
            const account = activeAccounts.find((acc) => acc.id === expense.bankAccountId)

            return (
              <Card key={expense.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[expense.category] || "#6b7280" }}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        {expense.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{expense.category}</span>
                        <span>•</span>
                        <span>{new Date(expense.expenseDate).toLocaleDateString("id-ID")}</span>
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-xl text-red-600">{formatCurrency(Number(expense.amount))}</span>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="hover:bg-blue-50 bg-transparent">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Expense</DialogTitle>
                          </DialogHeader>
                          <ExpenseForm expense={expense} onSubmit={updateExpense} bankAccounts={activeAccounts} />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteExpense(expense.id)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

interface ExpenseFormProps {
  expense?: Expense
  onSubmit: (expense: Expense | Omit<Expense, "id">) => void
  bankAccounts: BankAccount[]
}

function ExpenseForm({ expense, onSubmit, bankAccounts }: ExpenseFormProps) {
  const [amount, setAmount] = useState(expense?.amount.toString() || "")
  const [category, setCategory] = useState(expense?.category || "Other")
  const [description, setDescription] = useState(expense?.description || "")
  const [date, setDate] = useState(expense?.expenseDate || new Date().toISOString().split("T")[0])
  const [tags, setTags] = useState(expense?.tags.join(", ") || "")
  const [bankAccountId, setBankAccountId] = useState(expense?.bankAccountId?.toString() || "")
  const { formatCurrency } = useCurrency()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const expenseData = {
      amount: Number.parseFloat(amount),
      category,
      description,
      expenseDate: date,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      bankAccountId: bankAccountId ? Number.parseInt(bankAccountId) : undefined,
    }

    if (expense) {
      onSubmit({ ...expense, ...expenseData })
    } else {
      onSubmit(expenseData)
    }
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
        <Label htmlFor="bankAccount">Payment Method</Label>
        <Select
          value={bankAccountId || "none"}
          onValueChange={(value) => setBankAccountId(value === "none" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select account (optional)" />
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
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="What was this expense for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (optional)</Label>
        <Input
          id="tags"
          placeholder="recurring, business, etc. (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full">
        {expense ? "Update Expense" : "Add Expense"}
      </Button>
    </form>
  )
}
