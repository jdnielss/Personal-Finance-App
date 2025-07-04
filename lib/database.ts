import mysql from "mysql2/promise"

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "finance_app",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
}

let connection: mysql.Connection | null = null

export async function getConnection() {
  if (!connection) {
    connection = await mysql.createConnection(dbConfig)
  }
  return connection
}

export async function executeQuery(query: string, params: any[] = []) {
  const conn = await getConnection()
  try {
    const [results] = await conn.execute(query, params)
    return results
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export async function executeTransaction(queries: { query: string; params: any[] }[]) {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    const results = []
    for (const { query, params } of queries) {
      const [result] = await conn.execute(query, params)
      results.push(result)
    }

    await conn.commit()
    return results
  } catch (error) {
    await conn.rollback()
    console.error("Transaction error:", error)
    throw error
  }
}

// Helper function to get user ID from session (you'll need to implement proper auth)
export function getUserId(request: Request): number {
  // This is a simplified version - implement proper JWT/session handling
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    throw new Error("User not authenticated")
  }
  return Number.parseInt(userId)
}
