import { type NextRequest, NextResponse } from "next/server"
import { getUserId, prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { expenseDate: "desc" },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { amount, category, description, date, tags, bankAccountId } = await request.json()

    const expense = await prisma.$transaction(async (tx) => {
      const newExpense = await tx.expense.create({
        data: {
          userId,
          amount: Number.parseFloat(amount),
          category,
          description,
          expenseDate: new Date(date),
          tags: tags || [],
          bankAccountId: bankAccountId || null,
        },
      })

      if (bankAccountId) {
        await tx.bankAccount.update({
          where: { id: bankAccountId, userId },
          data: {
            balance: {
              decrement: Number.parseFloat(amount),
            },
          },
        })
      }

      return newExpense
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { id, amount, category, description, date, tags, bankAccountId, originalAmount, originalBankAccountId } =
      await request.json()

    const expense = await prisma.$transaction(async (tx) => {
      const updatedExpense = await tx.expense.update({
        where: { id, userId },
        data: {
          amount: Number.parseFloat(amount),
          category,
          description,
          expenseDate: new Date(date),
          tags: tags || [],
          bankAccountId: bankAccountId || null,
        },
      })

      if (originalBankAccountId && originalBankAccountId !== bankAccountId) {
        await tx.bankAccount.update({
          where: { id: originalBankAccountId, userId },
          data: {
            balance: {
              increment: Number.parseFloat(originalAmount),
            },
          },
        })
      }

      if (bankAccountId) {
        if (originalBankAccountId === bankAccountId) {
          const difference = Number.parseFloat(amount) - Number.parseFloat(originalAmount)
          await tx.bankAccount.update({
            where: { id: bankAccountId, userId },
            data: {
              balance: {
                decrement: difference,
              },
            },
          })
        } else {
          await tx.bankAccount.update({
            where: { id: bankAccountId, userId },
            data: {
              balance: {
                decrement: Number.parseFloat(amount),
              },
            },
          })
        }
      }

      return updatedExpense
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const id = Number.parseInt(searchParams.get("id") || "0")

    const expense = await prisma.expense.findUnique({
      where: { id, userId },
    })

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.expense.delete({
        where: { id, userId },
      })

      if (expense.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: expense.bankAccountId, userId },
          data: {
            balance: {
              increment: expense.amount,
            },
          },
        })
      }
    })

    return NextResponse.json({ message: "Expense deleted successfully" })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
  }
}
