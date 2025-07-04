import { type NextRequest, NextResponse } from "next/server"
import { getUserId, prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(budgets)
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { category, budget, color } = await request.json()

    const newBudget = await prisma.budget.create({
      data: {
        userId,
        category,
        budgetAmount: Number.parseFloat(budget),
        color,
      },
    })

    return NextResponse.json(newBudget)
  } catch (error) {
    console.error("Error creating budget:", error)
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { id, category, budget, color } = await request.json()

    const updatedBudget = await prisma.budget.update({
      where: { id, userId },
      data: {
        category,
        budgetAmount: Number.parseFloat(budget),
        color,
      },
    })

    return NextResponse.json(updatedBudget)
  } catch (error) {
    console.error("Error updating budget:", error)
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const id = Number.parseInt(searchParams.get("id") || "0")

    await prisma.budget.delete({
      where: { id, userId },
    })

    return NextResponse.json({ message: "Budget deleted successfully" })
  } catch (error) {
    console.error("Error deleting budget:", error)
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 })
  }
}
