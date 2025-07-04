# Finance App Database Setup Guide

## Prerequisites

1. **MySQL Database** - You need a MySQL database running
2. **Node.js** - Version 18 or higher
3. **npm/yarn** - Package manager

## Step 1: Install Dependencies

\`\`\`bash
npm install @prisma/client prisma
npm install mysql2
\`\`\`

## Step 2: Environment Setup

Create a \`.env\` file in your project root:

\`\`\`env
# Database URL for Prisma
DATABASE_URL="mysql://username:password@localhost:3306/finance_app"

# Example for local MySQL:
# DATABASE_URL="mysql://root:yourpassword@localhost:3306/finance_app"

# Example for cloud MySQL (like PlanetScale):
# DATABASE_URL="mysql://username:password@host.connect.psdb.cloud/finance_app?sslaccept=strict"
\`\`\`

## Step 3: Database Setup

### Option A: Using Prisma Push (Recommended for development)

\`\`\`bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Seed database with sample data
npx prisma db seed
\`\`\`

### Option B: Using Migrations (Recommended for production)

\`\`\`bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name init

# Seed database with sample data
npx prisma db seed
\`\`\`

## Step 4: Verify Setup

\`\`\`bash
# Open Prisma Studio to view your data
npx prisma studio
\`\`\`

This will open a web interface at http://localhost:5555 where you can see your database tables and data.

## Step 5: Test the Application

1. Start your Next.js development server:
   \`\`\`bash
   npm run dev
   \`\`\`

2. Open http://localhost:3000

3. Try creating a bank account - it should now save to the database!

## Troubleshooting

### Database Connection Issues

1. **Check MySQL is running**:
   \`\`\`bash
   # On macOS with Homebrew
   brew services start mysql
   
   # On Ubuntu/Debian
   sudo systemctl start mysql
   
   # On Windows
   net start mysql
   \`\`\`

2. **Verify database exists**:
   \`\`\`sql
   CREATE DATABASE finance_app;
   \`\`\`

3. **Check credentials**:
   - Make sure username/password in DATABASE_URL are correct
   - Test connection with MySQL client

### Prisma Issues

1. **Regenerate client after schema changes**:
   \`\`\`bash
   npx prisma generate
   \`\`\`

2. **Reset database if needed**:
   \`\`\`bash
   npx prisma migrate reset
   \`\`\`

3. **View detailed errors**:
   \`\`\`bash
   npx prisma db push --verbose
   \`\`\`

## Database Schema Overview

Your database will have these tables:
- \`users\` - User accounts
- \`bank_accounts\` - Bank accounts and e-wallets
- \`income\` - Income records
- \`expenses\` - Expense records
- \`budgets\` - Budget categories
- \`investments\` - Investment portfolio
- \`transfers\` - Account transfers

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
\`\`\`

## Cloud Database Options

### PlanetScale (Recommended)
- Serverless MySQL platform
- Free tier available
- Easy scaling
- Built-in branching

### Railway
- Simple deployment
- MySQL included
- Good for development

### AWS RDS
- Production-ready
- Multiple database engines
- Requires more setup
\`\`\`
