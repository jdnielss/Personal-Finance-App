import { type NextRequest, NextResponse } from "next/server"
import { getUserId, prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const incomes = await prisma.income.findMany({
      where: { userId },
      orderBy: { incomeDate: "desc" },
    })

    return NextResponse.json(incomes)
  } catch (error) {
    console.error("Error fetching income:", error)
    return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { amount, source, category, description, date, isRecurring, frequency, nextDate, bankAccountId } =
      await request.json()

    const income = await prisma.$transaction(async (tx) => {
      const newIncome = await tx.income.create({
        data: {
          userId,
          amount: Number.parseFloat(amount),
          source,
          category,
          description: description || null,
          incomeDate: new Date(date),
          isRecurring: isRecurring || false,
          frequency: frequency || null,
          nextDate: nextDate ? new Date(nextDate) : null,
          bankAccountId: bankAccountId || null,
        },
      })

      if (bankAccountId) {
        await tx.bankAccount.update({
          where: { id: bankAccountId, userId },
          data: {
            balance: {
              increment: Number.parseFloat(amount),
            },
          },
        })
      }

      return newIncome
    })

    return NextResponse.json(income)
  } catch (error) {
    console.error("Error creating income:", error)
    return NextResponse.json({ error: "Failed to create income" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const {
      id,
      amount,
      source,
      category,
      description,
      date,
      isRecurring,
      frequency,
      nextDate,
      bankAccountId,
      originalAmount,
      originalBankAccountId,
    } = await request.json()

    const income = await prisma.$transaction(async (tx) => {
      const updatedIncome = await tx.income.update({
        where: { id, userId },
        data: {
          amount: Number.parseFloat(amount),
          source,
          category,
          description: description || null,
          incomeDate: new Date(date),
          isRecurring: isRecurring || false,
          frequency: frequency || null,
          nextDate: nextDate ? new Date(nextDate) : null,
          bankAccountId: bankAccountId || null,
        },
      })

      if (originalBankAccountId && originalBankAccountId !== bankAccountId) {
        await tx.bankAccount.update({
          where: { id: originalBankAccountId, userId },
          data: {
            balance: {
              decrement: Number.parseFloat(originalAmount),
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
                increment: difference,
              },
            },
          })
        } else {
          await tx.bankAccount.update({
            where: { id: bankAccountId, userId },
            data: {
              balance: {
                increment: Number.parseFloat(amount),
              },
            },
          })
        }
      }

      return updatedIncome
    })

    return NextResponse.json(income)
  } catch (error) {
    console.error("Error updating income:", error)
    return NextResponse.json({ error: "Failed to update income" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const id = Number.parseInt(searchParams.get("id") || "0")

    const income = await prisma.income.findUnique({
      where: { id, userId },
    })

    if (!income) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.income.delete({
        where: { id, userId },
      })

      if (income.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: income.bankAccountId, userId },
          data: {
            balance: {
              decrement: income.amount,
            },
          },
        })
      }
    })

    return NextResponse.json({ message: "Income deleted successfully" })
  } catch (error) {
    console.error("Error deleting income:", error)
    return NextResponse.json({ error: "Failed to delete income" }, { status: 500 })
  }
}
