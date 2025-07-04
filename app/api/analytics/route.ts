import { type NextRequest, NextResponse } from "next/server"
import { getUserId, prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "6months"

    const monthsBack = timeframe === "1month" ? 1 : timeframe === "3months" ? 3 : timeframe === "6months" ? 6 : 12
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthsBack)

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        expenseDate: {
          gte: startDate,
        },
      },
    })

    const categoryStats = expenses.reduce((acc: any, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = { amount: 0, count: 0, dates: [] }
      }
      acc[expense.category].amount += expense.amount
      acc[expense.category].count += 1
      acc[expense.category].dates.push(expense.expenseDate.toISOString())
      return acc
    }, {})

    const total = Object.values(categoryStats).reduce((sum: number, cat: any) => sum + cat.amount, 0)

    const analytics = Object.entries(categoryStats).map(([category, stats]: [string, any]) => ({
      category,
      amount: stats.amount,
      count: stats.count,
      percentage: total > 0 ? (stats.amount / total) * 100 : 0,
      avgAmount: stats.count > 0 ? stats.amount / stats.count : 0,
    }))

    return NextResponse.json({
      analytics: analytics.sort((a, b) => b.amount - a.amount),
      total,
      timeframe,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
