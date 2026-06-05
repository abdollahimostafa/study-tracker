// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

let prisma: PrismaClient

if (!globalForPrisma.prisma) {
  // ساخت یک Connection Pool بهینه برای Vercel Postgres و سازگار با نسخه ۷ پریزما
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // برای جلوگیری از ارورهای SSL در هاست‌های ابری
  })
  const adapter = new PrismaPg(pool)
  
  globalForPrisma.prisma = new PrismaClient({ adapter })
}

prisma = globalForPrisma.prisma

export { prisma }