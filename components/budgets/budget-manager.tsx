"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useCurrency } from "./currency-provider"
import { useApi, apiCall } from "@/hooks/use-api"

interface Budget {
  id: number
  category: string
  budgetAmount: number
  color: string
}

const DEFAULT_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Other",
]

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

export function BudgetManager() {
  const [isAddingBudget, setIsAddingBudget] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const { toast } = useToast()
  const { formatCurrency, getCurrencySymbol } = useCurrency()

  const { data: budgets, loading, error, refetch } = useApi<Budget[]>("/api/budgets")

  const addBudget = async (budgetData: Omit<Budget, "id">) => {
    try {
      // Check if category already has a budget
      if (budgets?.some((b) => b.category === budgetData.category)) {
        toast({
          title: "Budget Already Exists",
          description: "This category already has a budget. Edit the existing one instead.",
          variant: "destructive",
        })
        return
      }

      await apiCall("/api/budgets", {
        method: "POST",
        body: {
          category: budgetData.category,
          budget: budgetData.budgetAmount,
          color: budgetData.color,
        },
      })

      await refetch()
      setIsAddingBudget(false)
      toast({
        title: "Budget Created",
        description: `Set budget of ${formatCurrency(budgetData.budgetAmount)} for ${budgetData.category}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create budget",
        variant: "destructive",
      })
    }
  }

  const updateBudget = async (updatedBudget: Budget) => {
    try {
      await apiCall("/api/budgets", {
        method: "PUT",
        body: {
          id: updatedBudget.id,
          category: updatedBudget.category,
          budget: updatedBudget.budgetAmount,
          color: updatedBudget.color,
        },
      })

      await refetch()
      setEditingBudget(null)
      toast({
        title: "Budget Updated",
        description: "Budget has been successfully updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive",
      })
    }
  }

  const deleteBudget = async (id: number) => {
    try {
      await apiCall(`/api/budgets?id=${id}`, {
        method: "DELETE",
      })

      await refetch()
      toast({
        title: "Budget Deleted",
        description: "Budget has been removed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading budgets...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading budgets: {error}</p>
        <Button onClick={refetch} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  const budgetList = budgets || []
  const totalBudget = budgetList.reduce((sum, budget) => sum + Number(budget.budgetAmount), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monthly Budgets</h2>
          <p className="text-muted-foreground">
            Total Budget: {formatCurrency(totalBudget)} across {budgetList.length} categories
          </p>
        </div>
        <Dialog open={isAddingBudget} onOpenChange={setIsAddingBudget}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>Set a monthly spending limit for a category</DialogDescription>
            </DialogHeader>
            <BudgetForm onSubmit={addBudget} existingCategories={budgetList.map((b) => b.category)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Budgets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgetList.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No budgets created yet</p>
              <Button onClick={() => setIsAddingBudget(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          budgetList.map((budget) => (
            <Card key={budget.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: budget.color }} />
                    <CardTitle className="text-lg">{budget.category}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Budget</DialogTitle>
                        </DialogHeader>
                        <BudgetForm
                          budget={budget}
                          onSubmit={updateBudget}
                          existingCategories={budgetList.map((b) => b.category).filter((c) => c !== budget.category)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => deleteBudget(budget.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(Number(budget.budgetAmount))}</div>
                <p className="text-sm text-muted-foreground">Monthly limit</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

interface BudgetFormProps {
  budget?: Budget
  onSubmit: (budget: Budget | Omit<Budget, "id">) => void
  existingCategories: string[]
}

function BudgetForm({ budget, onSubmit, existingCategories }: BudgetFormProps) {
  const [category, setCategory] = useState(budget?.category || "")
  const [budgetAmount, setBudgetAmount] = useState(budget?.budgetAmount.toString() || "")
  const { getCurrencySymbol } = useCurrency()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const budgetData = {
      category,
      budgetAmount: Number.parseFloat(budgetAmount),
      color: CATEGORY_COLORS[category] || "#6b7280",
    }

    if (budget) {
      onSubmit({ ...budget, ...budgetData })
    } else {
      onSubmit(budgetData)
    }
  }

  const availableCategories = DEFAULT_CATEGORIES.filter((cat) => !existingCategories.includes(cat))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory} required disabled={!!budget}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {(budget ? [budget.category] : availableCategories).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Monthly Budget</Label>
        <Input
          id="budget"
          type="number"
          step="0.01"
          placeholder={`0${getCurrencySymbol() === "Rp" ? "" : ".00"}`}
          value={budgetAmount}
          onChange={(e) => setBudgetAmount(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full">
        {budget ? "Update Budget" : "Create Budget"}
      </Button>
    </form>
  )
}
