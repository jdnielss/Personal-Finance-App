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
import { Plus, Edit, Trash2, CreditCard, Eye, EyeOff, Wallet, Loader2 } from "lucide-react"
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

interface BankAccount {
  id: number
  name: string
  bank_name: string
  account_number: string
  balance: number
  account_type: "checking" | "savings" | "credit" | "ewallet"
  color: string
  is_active: boolean
}

const INDONESIAN_BANKS = [
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

const E_WALLETS = [
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

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking Account" },
  { value: "savings", label: "Savings Account" },
  { value: "credit", label: "Credit Card" },
  { value: "ewallet", label: "E-Wallet" },
]

const ACCOUNT_COLORS = [
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

export function BankAccountManagerMySQL() {
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [showBalances, setShowBalances] = useState(true)
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()

  const { data: accounts, loading, error, refetch } = useApi<BankAccount[]>("/api/bank-accounts")

  const addAccount = async (accountData: Omit<BankAccount, "id">) => {
    try {
      await apiCall("/api/bank-accounts", {
        method: "POST",
        body: {
          name: accountData.name,
          bankName: accountData.bank_name,
          accountNumber: accountData.account_number,
          balance: accountData.balance,
          type: accountData.account_type,
          color: accountData.color,
          isActive: accountData.is_active,
        },
      })

      await refetch()
      setIsAddingAccount(false)
      toast({
        title: "Account Added",
        description: `Added ${accountData.bank_name} account successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add account",
        variant: "destructive",
      })
    }
  }

  const updateAccount = async (updatedAccount: BankAccount) => {
    try {
      await apiCall("/api/bank-accounts", {
        method: "PUT",
        body: {
          id: updatedAccount.id,
          name: updatedAccount.name,
          bankName: updatedAccount.bank_name,
          accountNumber: updatedAccount.account_number,
          balance: updatedAccount.balance,
          type: updatedAccount.account_type,
          color: updatedAccount.color,
          isActive: updatedAccount.is_active,
        },
      })

      await refetch()
      setEditingAccount(null)
      toast({
        title: "Account Updated",
        description: "Account has been successfully updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update account",
        variant: "destructive",
      })
    }
  }

  const deleteAccount = async (id: number) => {
    try {
      await apiCall(`/api/bank-accounts?id=${id}`, {
        method: "DELETE",
      })

      await refetch()
      toast({
        title: "Account Deleted",
        description: "Account has been removed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      })
    }
  }

  const toggleAccountStatus = async (account: BankAccount) => {
    try {
      await apiCall("/api/bank-accounts", {
        method: "PUT",
        body: {
          ...account,
          isActive: !account.is_active,
        },
      })

      await refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update account status",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading accounts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading accounts: {error}</p>
        <Button onClick={refetch} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  const accountList = accounts || []
  const totalBalance = accountList
    .filter((acc) => acc.account_type !== "credit")
    .reduce((sum, acc) => sum + acc.balance, 0)
  const activeAccounts = accountList.filter((acc) => acc.is_active)
  const bankAccountsOnly = accountList.filter(
    (acc) => acc.account_type === "checking" || acc.account_type === "savings",
  )
  const eWallets = accountList.filter((acc) => acc.account_type === "ewallet")

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Balance</CardTitle>
            <div className="bg-green-100 p-2 rounded-lg">
              <Wallet className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-green-600 mt-1">Across all accounts</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Active Accounts</CardTitle>
            <div className="bg-blue-100 p-2 rounded-lg">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{activeAccounts.length}</div>
            <p className="text-xs text-blue-600 mt-1">of {accountList.length} total</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Bank Accounts</CardTitle>
            <div className="bg-indigo-100 p-2 rounded-lg">
              <CreditCard className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700">{bankAccountsOnly.length}</div>
            <p className="text-xs text-indigo-600 mt-1">Traditional banks</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">E-Wallets</CardTitle>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Wallet className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{eWallets.length}</div>
            <p className="text-xs text-purple-600 mt-1">Digital wallets</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bank Accounts</h2>
          <p className="text-muted-foreground">Manage your bank accounts and e-wallets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowBalances(!showBalances)}>
            {showBalances ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showBalances ? "Hide" : "Show"} Balances
          </Button>
          <Dialog open={isAddingAccount} onOpenChange={setIsAddingAccount}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>Add a bank account or e-wallet to track</DialogDescription>
              </DialogHeader>
              <AccountForm onSubmit={addAccount} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accountList.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No accounts added yet</p>
              <Button onClick={() => setIsAddingAccount(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          accountList.map((account) => (
            <Card key={account.id} className={`${!account.is_active ? "opacity-60" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: account.color }} />
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{account.bank_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge variant={account.is_active ? "default" : "secondary"}>
                      {account.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">
                      {ACCOUNT_TYPES.find((t) => t.value === account.account_type)?.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">{showBalances ? formatCurrency(account.balance) : "••••••"}</div>
                  <p className="text-xs text-muted-foreground">••••{account.account_number.slice(-4)}</p>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => toggleAccountStatus(account)}>
                    {account.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Account</DialogTitle>
                      </DialogHeader>
                      <AccountForm account={account} onSubmit={updateAccount} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={() => deleteAccount(account.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

interface AccountFormProps {
  account?: BankAccount
  onSubmit: (account: BankAccount | Omit<BankAccount, "id">) => void
}

function AccountForm({ account, onSubmit }: AccountFormProps) {
  const [name, setName] = useState(account?.name || "")
  const [bankName, setBankName] = useState(account?.bank_name || "")
  const [accountNumber, setAccountNumber] = useState(account?.account_number || "")
  const [balance, setBalance] = useState(account?.balance.toString() || "0")
  const [type, setType] = useState(account?.account_type || "checking")
  const [color, setColor] = useState(account?.color || ACCOUNT_COLORS[0])
  const [isActive, setIsActive] = useState(account?.is_active ?? true)
  const { getCurrencySymbol } = useCurrency()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const accountData = {
      name,
      bank_name: bankName,
      account_number: accountNumber,
      balance: Number.parseFloat(balance),
      account_type: type as BankAccount["account_type"],
      color,
      is_active: isActive,
    }

    if (account) {
      onSubmit({ ...account, ...accountData })
    } else {
      onSubmit(accountData)
    }
  }

  const bankOptions = type === "ewallet" ? E_WALLETS : INDONESIAN_BANKS

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Account Name</Label>
        <Input
          id="name"
          placeholder="My Main Account"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Account Type</Label>
        <Select value={type} onValueChange={(value) => setType(value as BankAccount["account_type"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankName">{type === "ewallet" ? "E-Wallet Provider" : "Bank Name"}</Label>
        <Select value={bankName} onValueChange={setBankName} required>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${type === "ewallet" ? "e-wallet" : "bank"}`} />
          </SelectTrigger>
          <SelectContent>
            {bankOptions.map((bank) => (
              <SelectItem key={bank} value={bank}>
                {bank}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accountNumber">{type === "ewallet" ? "Phone/Account ID" : "Account Number"}</Label>
          <Input
            id="accountNumber"
            placeholder={type === "ewallet" ? "081234567890" : "1234567890"}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="balance">Current Balance</Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            placeholder={`0${getCurrencySymbol() === "Rp" ? "" : ".00"}`}
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Account Color</Label>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_COLORS.map((colorOption) => (
            <button
              key={colorOption}
              type="button"
              className={`w-8 h-8 rounded-full border-2 ${
                color === colorOption ? "border-gray-800" : "border-gray-300"
              }`}
              style={{ backgroundColor: colorOption }}
              onClick={() => setColor(colorOption)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <Label htmlFor="isActive">Account is active</Label>
      </div>

      <Button type="submit" className="w-full">
        {account ? "Update Account" : "Add Account"}
      </Button>
    </form>
  )
}
