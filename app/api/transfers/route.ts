import { type NextRequest, NextResponse } from "next/server"
import { getUserId, prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const transfers = await prisma.transfer.findMany({
      where: { userId },
      orderBy: { transferDate: "desc" },
    })

    return NextResponse.json(transfers)
  } catch (error) {
    console.error("Error fetching transfers:", error)
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { fromAccountId, toAccountId, amount, transferFee, description, date } = await request.json()

    const fromAccount = await prisma.bankAccount.findUnique({
      where: { id: fromAccountId, userId },
    })

    const toAccount = await prisma.bankAccount.findUnique({
      where: { id: toAccountId, userId },
    })

    if (!fromAccount || !toAccount) {
      return NextResponse.json({ error: "Invalid account selection" }, { status: 400 })
    }

    const totalAmount = Number.parseFloat(amount) + Number.parseFloat(transferFee)
    if (fromAccount.balance < totalAmount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    const transfer = await prisma.$transaction(async (tx) => {
      const newTransfer = await tx.transfer.create({
        data: {
          userId,
          fromAccountId,
          toAccountId,
          fromAccountName: fromAccount.name,
          toAccountName: toAccount.name,
          amount: Number.parseFloat(amount),
          transferFee: Number.parseFloat(transferFee),
          description,
          transferDate: new Date(date),
        },
      })

      await tx.bankAccount.update({
        where: { id: fromAccountId, userId },
        data: {
          balance: {
            decrement: totalAmount,
          },
        },
      })

      await tx.bankAccount.update({
        where: { id: toAccountId, userId },
        data: {
          balance: {
            increment: Number.parseFloat(amount),
          },
        },
      })

      return newTransfer
    })

    return NextResponse.json(transfer)
  } catch (error) {
    console.error("Error creating transfer:", error)
    return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 })
  }
}
