import { type NextRequest, NextResponse } from "next/server"
import { getUserId, prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Error fetching bank accounts:", error)
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { name, bankName, accountNumber, balance, type, color, isActive } = await request.json()

    const account = await prisma.bankAccount.create({
      data: {
        userId,
        name,
        bankName,
        accountNumber,
        balance: Number.parseFloat(balance) || 0,
        type,
        color,
        isActive,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error("Error creating bank account:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { id, name, bankName, accountNumber, balance, type, color, isActive } = await request.json()

    const account = await prisma.bankAccount.update({
      where: { id, userId },
      data: {
        name,
        bankName,
        accountNumber,
        balance: Number.parseFloat(balance) || 0,
        type,
        color,
        isActive,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error("Error updating bank account:", error)
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const id = Number.parseInt(searchParams.get("id") || "0")

    await prisma.bankAccount.delete({
      where: { id, userId },
    })

    return NextResponse.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Error deleting bank account:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
