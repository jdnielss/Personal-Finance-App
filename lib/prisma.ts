import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export function getUserId(request: NextRequest): number {
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    throw new Error("Authentication required")
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    return decoded.userId
  } catch (error) {
    throw new Error("Invalid authentication token")
  }
}

export type {
  User,
  BankAccount,
  Income,
  Expense,
  Budget,
  Investment,
  Transfer,
  AccountType,
  RecurrenceType,
  InvestmentType,
} from "@prisma/client"
