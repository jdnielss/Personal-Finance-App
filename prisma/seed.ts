import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12)

  const user = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@example.com",
      password: hashedPassword,
    },
  })

  await prisma.bankAccount.createMany({
    data: [
      {
        userId: user.id,
        name: "BCA Main Account",
        bankName: "BCA (Bank Central Asia)",
        accountNumber: "1234567890",
        balance: 5000000,
        type: "checking",
        color: "#3b82f6",
        isActive: true,
      },
      {
        userId: user.id,
        name: "OVO Wallet",
        bankName: "OVO",
        accountNumber: "081234567890",
        balance: 500000,
        type: "ewallet",
        color: "#8b5cf6",
        isActive: true,
      },
    ],
  })

  await prisma.budget.createMany({
    data: [
      {
        userId: user.id,
        category: "Food & Dining",
        budgetAmount: 1000000,
        color: "#ef4444",
      },
      {
        userId: user.id,
        category: "Transportation",
        budgetAmount: 500000,
        color: "#3b82f6",
      },
    ],
  })

  console.log("Seed data created successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
