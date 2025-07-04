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
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useCurrency } from "@/providers/currency-provider"
import { useApi, apiCall } from "@/hooks/use-api"

interface Investment {
  id: number
  symbol: string
  name: string
  type: "stock" | "mutual-fund" | "etf" | "bond"
  quantity: number
  purchasePrice: number
  currentPrice: number
  purchaseDate: string
}

const INVESTMENT_TYPES = [
  { value: "stock", label: "Stock" },
  { value: "mutual-fund", label: "Mutual Fund" },
  { value: "etf", label: "ETF" },
  { value: "bond", label: "Bond" },
]

export function InvestmentTracker() {
  const [isAddingInvestment, setIsAddingInvestment] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const { toast } = useToast()
  const { formatCurrency, getCurrencySymbol } = useCurrency()

  const { data: investments, loading, error, refetch } = useApi<Investment[]>("/api/investments")

  const addInvestment = async (investmentData: Omit<Investment, "id">) => {
    try {
      await apiCall("/api/investments", {
        method: "POST",
        body: {
          symbol: investmentData.symbol,
          name: investmentData.name,
          type: investmentData.type,
          quantity: investmentData.quantity,
          purchasePrice: investmentData.purchasePrice,
          currentPrice: investmentData.currentPrice,
          purchaseDate: investmentData.purchaseDate,
        },
      })

      await refetch()
      setIsAddingInvestment(false)
      toast({
        title: "Investment Added",
        description: `Added ${investmentData.symbol} to your portfolio`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add investment",
        variant: "destructive",
      })
    }
  }

  const updateInvestment = async (updatedInvestment: Investment) => {
    try {
      await apiCall("/api/investments", {
        method: "PUT",
        body: {
          id: updatedInvestment.id,
          symbol: updatedInvestment.symbol,
          name: updatedInvestment.name,
          type: updatedInvestment.type,
          quantity: updatedInvestment.quantity,
          purchasePrice: updatedInvestment.purchasePrice,
          currentPrice: updatedInvestment.currentPrice,
          purchaseDate: updatedInvestment.purchaseDate,
        },
      })

      await refetch()
      setEditingInvestment(null)
      toast({
        title: "Investment Updated",
        description: "Investment has been successfully updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update investment",
        variant: "destructive",
      })
    }
  }

  const deleteInvestment = async (id: number) => {
    try {
      await apiCall(`/api/investments?id=${id}`, {
        method: "DELETE",
      })

      await refetch()
      toast({
        title: "Investment Removed",
        description: "Investment has been removed from your portfolio",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete investment",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading investments...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading investments: {error}</p>
        <Button onClick={refetch} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  const investmentList = investments || []

  const calculatePortfolioValue = () => {
    return investmentList.reduce((total, inv) => total + Number(inv.currentPrice) * Number(inv.quantity), 0)
  }

  const calculateTotalInvested = () => {
    return investmentList.reduce((total, inv) => total + Number(inv.purchasePrice) * Number(inv.quantity), 0)
  }

  const calculateTotalGainLoss = () => {
    return calculatePortfolioValue() - calculateTotalInvested()
  }

  const portfolioValue = calculatePortfolioValue()
  const totalInvested = calculateTotalInvested()
  const totalGainLoss = calculateTotalGainLoss()
  const gainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold flex items-center ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {totalGainLoss >= 0 ? <TrendingUp className="h-5 w-5 mr-1" /> : <TrendingDown className="h-5 w-5 mr-1" />}
              {formatCurrency(Math.abs(totalGainLoss))}
            </div>
            <p className={`text-xs ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
              {gainLossPercentage >= 0 ? "+" : ""}
              {gainLossPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investmentList.length}</div>
            <p className="text-xs text-muted-foreground">investments</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Investment Portfolio</h2>
          <p className="text-muted-foreground">Track your stocks, mutual funds, and other investments</p>
        </div>
        <Dialog open={isAddingInvestment} onOpenChange={setIsAddingInvestment}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Investment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Investment</DialogTitle>
              <DialogDescription>Enter the details of your investment</DialogDescription>
            </DialogHeader>
            <InvestmentForm onSubmit={addInvestment} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Investments List */}
      <div className="space-y-4">
        {investmentList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No investments tracked yet</p>
              <Button onClick={() => setIsAddingInvestment(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Investment
              </Button>
            </CardContent>
          </Card>
        ) : (
          investmentList.map((investment) => {
            const currentValue = Number(investment.currentPrice) * Number(investment.quantity)
            const investedValue = Number(investment.purchasePrice) * Number(investment.quantity)
            const gainLoss = currentValue - investedValue
            const gainLossPercent = investedValue > 0 ? (gainLoss / investedValue) * 100 : 0

            return (
              <Card key={investment.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{investment.symbol}</h3>
                          <Badge variant="outline">
                            {INVESTMENT_TYPES.find((t) => t.value === investment.type)?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{investment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {investment.quantity} shares • Purchased{" "}
                          {new Date(investment.purchaseDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold">{formatCurrency(currentValue)}</div>
                      <div
                        className={`text-sm flex items-center justify-end ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {gainLoss >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {gainLoss >= 0 ? "+" : ""}
                        {formatCurrency(gainLoss)} ({gainLossPercent >= 0 ? "+" : ""}
                        {gainLossPercent.toFixed(2)}%)
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(Number(investment.currentPrice))} per share
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Investment</DialogTitle>
                          </DialogHeader>
                          <InvestmentForm investment={investment} onSubmit={updateInvestment} />
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="sm" onClick={() => deleteInvestment(investment.id)}>
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

interface InvestmentFormProps {
  investment?: Investment
  onSubmit: (investment: Investment | Omit<Investment, "id">) => void
}

function InvestmentForm({ investment, onSubmit }: InvestmentFormProps) {
  const [symbol, setSymbol] = useState(investment?.symbol || "")
  const [name, setName] = useState(investment?.name || "")
  const [type, setType] = useState(investment?.type || "stock")
  const [quantity, setQuantity] = useState(investment?.quantity.toString() || "")
  const [purchasePrice, setPurchasePrice] = useState(investment?.purchasePrice.toString() || "")
  const [currentPrice, setCurrentPrice] = useState(investment?.currentPrice.toString() || "")
  const [purchaseDate, setPurchaseDate] = useState(investment?.purchaseDate || new Date().toISOString().split("T")[0])

  const { getCurrencySymbol } = useCurrency()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const investmentData = {
      symbol: symbol.toUpperCase(),
      name,
      type: type as Investment["type"],
      quantity: Number.parseFloat(quantity),
      purchasePrice: Number.parseFloat(purchasePrice),
      currentPrice: Number.parseFloat(currentPrice),
      purchaseDate,
    }

    if (investment) {
      onSubmit({ ...investment, ...investmentData })
    } else {
      onSubmit(investmentData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol</Label>
          <Input id="symbol" placeholder="AAPL" value={symbol} onChange={(e) => setSymbol(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(value) => setType(value as Investment["type"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVESTMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Company/Fund Name</Label>
        <Input id="name" placeholder="Apple Inc." value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            step="0.001"
            placeholder="10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Purchase Price</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="0.01"
            placeholder={`150${getCurrencySymbol() === "Rp" ? "" : ".00"}`}
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentPrice">Current Price</Label>
          <Input
            id="currentPrice"
            type="number"
            step="0.01"
            placeholder={`155${getCurrencySymbol() === "Rp" ? "" : ".00"}`}
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        {investment ? "Update Investment" : "Add Investment"}
      </Button>
    </form>
  )
}
