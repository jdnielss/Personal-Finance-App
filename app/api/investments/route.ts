import { type NextRequest, NextResponse } from "next/server"
import { getUserId, prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const investments = await prisma.investment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(investments)
  } catch (error) {
    console.error("Error fetching investments:", error)
    return NextResponse.json({ error: "Failed to fetch investments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { symbol, name, type, quantity, purchasePrice, currentPrice, purchaseDate } = await request.json()

    const investment = await prisma.investment.create({
      data: {
        userId,
        symbol,
        name,
        type,
        quantity: Number.parseFloat(quantity),
        purchasePrice: Number.parseFloat(purchasePrice),
        currentPrice: Number.parseFloat(currentPrice),
        purchaseDate: new Date(purchaseDate),
      },
    })

    return NextResponse.json(investment)
  } catch (error) {
    console.error("Error creating investment:", error)
    return NextResponse.json({ error: "Failed to create investment" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { id, symbol, name, type, quantity, purchasePrice, currentPrice, purchaseDate } = await request.json()

    const investment = await prisma.investment.update({
      where: { id, userId },
      data: {
        symbol,
        name,
        type,
        quantity: Number.parseFloat(quantity),
        purchasePrice: Number.parseFloat(purchasePrice),
        currentPrice: Number.parseFloat(currentPrice),
        purchaseDate: new Date(purchaseDate),
      },
    })

    return NextResponse.json(investment)
  } catch (error) {
    console.error("Error updating investment:", error)
    return NextResponse.json({ error: "Failed to update investment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const id = Number.parseInt(searchParams.get("id") || "0")

    await prisma.investment.delete({
      where: { id, userId },
    })

    return NextResponse.json({ message: "Investment deleted successfully" })
  } catch (error) {
    console.error("Error deleting investment:", error)
    return NextResponse.json({ error: "Failed to delete investment" }, { status: 500 })
  }
}
