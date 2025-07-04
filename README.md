# Finance App Database Setup Guide

## Prerequisites

1. **MySQL Database** - You need a MySQL database running
2. **Node.js** - Version 18 or higher
3. **npm/yarn** - Package manager

## Step 1: Install Dependencies

```
npm install @prisma/client prisma
npm install mysql2
```

## Step 2: Environment Setup

Create a \`.env\` file in your project root:

```
# Database URL for Prisma
DATABASE_URL="mysql://username:password@localhost:3306/finance_app"

# JWT Secret (generate a secure random string for production)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## Step 3: Database Setup

### Option A: Using Prisma Push (Recommended for development)

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Seed database with sample data
npx prisma db seed
```

This will open a web interface at http://localhost:5555 where you can see your database tables and data.

# Step 4: Test the Application

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Try creating a bank account - it should now save to the database!


## Database Schema Overview

Your database will have these tables:
- users - User accounts
- bank_accounts - Bank accounts and e-wallets
- income - Income records
- expenses - Expense records
- budgets - Budget categories
- investments - Investment portfolio
- transfers - Account transfers

## Sample Data

After seeding, you'll have:
- Demo user account
- Sample BCA bank account with 5M IDR
- Sample OVO e-wallet with 500K IDR
- Sample budgets for Food, Transportation, Entertainment
- Sample income and expense records

## Next Steps

1. **Add Authentication** - Implement proper user authentication
2. **Add Validation** - Add input validation and error handling
3. **Add Tests** - Write tests for your API endpoints
4. **Deploy** - Deploy to production with proper environment variables

