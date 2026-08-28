import { PrismaClient } from '@prisma/client';

const fallbackDbUrl = 'postgresql://neondb_owner:npg_0dn4tgTXlGpN@ep-royal-bar-b1u7umiy-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const dbUrl = process.env.DATABASE_URL || fallbackDbUrl;

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = dbUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
