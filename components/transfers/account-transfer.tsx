"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowRightLeft, History, CreditCard, AlertCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCurrency } from "@/providers/currency-provider"
import { useApi, apiCall } from "@/hooks/use-api"
import { CurrencyInput } from "../ui/currency-input"

interface Transfer {
  id: number
  fromAccountId: number
  toAccountId: number
  fromAccountName: string
  toAccountName: string
  amount: number
  description: string
  date: string
  transferFee: number
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

export function AccountTransfer() {
  const [isTransferring, setIsTransferring] = useState(false)
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()

  const {
    data: transfers,
    loading: transfersLoading,
    error: transfersError,
    refetch: refetchTransfers,
  } = useApi<Transfer[]>("/api/transfers")
  const {
    data: bankAccounts,
    loading: accountsLoading,
    refetch: refetchAccounts,
  } = useApi<BankAccount[]>("/api/bank-accounts")

  const loading = transfersLoading || accountsLoading

  const executeTransfer = async (transferData: Omit<Transfer, "id">) => {
    try {
      await apiCall("/api/transfers", {
        method: "POST",
        body: {
          fromAccountId: transferData.fromAccountId,
          toAccountId: transferData.toAccountId,
          amount: transferData.amount,
          transferFee: transferData.transferFee,
          description: transferData.description,
          date: transferData.date,
        },
      })

      await refetchTransfers()
      await refetchAccounts() // Refresh account balances
      setIsTransferring(false)
      toast({
        title: "Transfer Successful",
        description: `Transferred ${formatCurrency(transferData.amount)}`,
      })
    } catch (error: any) {
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to complete transfer",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading transfers...</span>
      </div>
    )
  }

  if (transfersError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading transfers: {transfersError}</p>
        <Button onClick={refetchTransfers} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  const transferList = transfers || []
  const accountList = bankAccounts || []
  const activeAccounts = accountList.filter((acc) => acc.isActive && acc.accountType !== "credit")
  const totalTransferred = transferList.reduce((sum, transfer) => sum + Number(transfer.amount), 0)
  const totalFees = transferList.reduce((sum, transfer) => sum + Number(transfer.transferFee), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Account Transfers</h2>
            <p className="text-purple-100">Transfer money between your Indonesian bank accounts and e-wallets</p>
          </div>
          <Dialog open={isTransferring} onOpenChange={setIsTransferring}>
            <DialogTrigger asChild>
              <Button className="bg-white text-purple-600 hover:bg-purple-50">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                New Transfer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Money</DialogTitle>
                <DialogDescription>Transfer funds between your accounts</DialogDescription>
              </DialogHeader>
              <TransferForm onSubmit={executeTransfer} bankAccounts={activeAccounts} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Transferred</CardTitle>
            <div className="bg-blue-100 p-2 rounded-lg">
              <ArrowRightLeft className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatCurrency(totalTransferred)}</div>
            <p className="text-xs text-blue-600 mt-1">{transferList.length} transfers</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Transfer Fees</CardTitle>
            <div className="bg-orange-100 p-2 rounded-lg">
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{formatCurrency(totalFees)}</div>
            <p className="text-xs text-orange-600 mt-1">Total fees paid</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Active Accounts</CardTitle>
            <div className="bg-green-100 p-2 rounded-lg">
              <CreditCard className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{activeAccounts.length}</div>
            <p className="text-xs text-green-600 mt-1">Available for transfer</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Balances */}
      {activeAccounts.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Account Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
          </CardContent>
        </Card>
      )}

      {/* Transfer History */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-purple-600" />
            Transfer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transferList.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRightLeft className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4 text-lg">No transfers made yet</p>
              <Button onClick={() => setIsTransferring(true)} className="bg-purple-600 hover:bg-purple-700">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Make Your First Transfer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {transferList.map((transfer) => {
                const fromAccount = accountList.find((acc) => acc.id === transfer.fromAccountId)
                const toAccount = accountList.find((acc) => acc.id === transfer.toAccountId)

                return (
                  <div key={transfer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fromAccount?.color }} />
                          <span className="text-sm font-medium">{transfer.fromAccountName}</span>
                        </div>
                        <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: toAccount?.color }} />
                          <span className="text-sm font-medium">{transfer.toAccountName}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{transfer.description}</p>
                        <p className="text-xs text-gray-500">{new Date(transfer.date).toLocaleDateString("id-ID")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">{formatCurrency(Number(transfer.amount))}</div>
                      {Number(transfer.transferFee) > 0 && (
                        <div className="text-xs text-orange-600">
                          Fee: {formatCurrency(Number(transfer.transferFee))}
                        </div>
                      )}
                    </div>
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

interface TransferFormProps {
  onSubmit: (transfer: Omit<Transfer, "id">) => void
  bankAccounts: BankAccount[]
}

function TransferForm({ onSubmit, bankAccounts }: TransferFormProps) {
  const [fromAccountId, setFromAccountId] = useState("")
  const [toAccountId, setToAccountId] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [customTransferFee, setCustomTransferFee] = useState("2500")
  const { formatCurrency } = useCurrency()

  const fromAccount = bankAccounts.find((acc) => acc.id === Number.parseInt(fromAccountId))
  const toAccount = bankAccounts.find((acc) => acc.id === Number.parseInt(toAccountId))

  // Calculate transfer fee based on account types
  const calculateTransferFee = (): number => {
    if (customTransferFee) {
      return Number.parseFloat(customTransferFee)
    }

    if (!fromAccount || !toAccount) return 0
    if (fromAccount.bankName === toAccount.bankName) return 0
    if (
      (fromAccount.accountType === "checking" || fromAccount.accountType === "savings") &&
      (toAccount.accountType === "checking" || toAccount.accountType === "savings")
    ) {
      return 6500
    }

    if (fromAccount.accountType === "ewallet" || toAccount.accountType === "ewallet") {
      return 2500
    }

    return 0
  }

  const transferFee = calculateTransferFee()
  const totalAmount = Number.parseFloat(amount || "0") + transferFee

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (fromAccountId === toAccountId) {
      return
    }

    const transferData = {
      fromAccountId: Number.parseInt(fromAccountId),
      toAccountId: Number.parseInt(toAccountId),
      amount: Number.parseFloat(amount),
      description: description || `Transfer from ${fromAccount?.name} to ${toAccount?.name}`,
      date,
      transferFee,
      fromAccountName: fromAccount?.name || "",
      toAccountName: toAccount?.name || "",
    }

    onSubmit(transferData)
  }

  const availableToAccounts = bankAccounts.filter((acc) => acc.id !== Number.parseInt(fromAccountId))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fromAccount">From Account</Label>
        <Select value={fromAccountId} onValueChange={setFromAccountId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select source account" />
          </SelectTrigger>
          <SelectContent>
            {bankAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id.toString()}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                  <span>{account.name}</span>
                  <span className="text-muted-foreground">({formatCurrency(Number(account.balance))})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="toAccount">To Account</Label>
        <Select value={toAccountId} onValueChange={setToAccountId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select destination account" />
          </SelectTrigger>
          <SelectContent>
            {availableToAccounts.map((account) => (
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
      </div>

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
        <Label htmlFor="transferFee">Transfer Fee (IDR)</Label>
        <CurrencyInput
          id="transferFee"
          value={customTransferFee}
          onChange={setCustomTransferFee}
          placeholder="2500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          placeholder="Transfer purpose"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Transfer Summary */}
      {fromAccount && toAccount && amount && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-gray-900">Transfer Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Transfer Amount:</span>
              <span>{formatCurrency(Number.parseFloat(amount))}</span>
            </div>
            <div className="flex justify-between">
              <span>Transfer Fee:</span>
              <span className={transferFee > 0 ? "text-orange-600" : "text-green-600"}>
                {transferFee > 0 ? formatCurrency(transferFee) : "FREE"}
              </span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Total Deducted:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {fromAccount.balance < totalAmount && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                Insufficient balance. Available: {formatCurrency(Number(fromAccount.balance))}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!fromAccount || !toAccount || Number(fromAccount.balance) < totalAmount}
      >
        Transfer {amount && formatCurrency(Number.parseFloat(amount))}
      </Button>
    </form>
  )
}
