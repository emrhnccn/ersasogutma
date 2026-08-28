import { PrismaClient } from '@prisma/client';

const fallbackUri = 'mongodb+srv://ersa-admin:ersaadmin123@affanccn.i1pqyjq.mongodb.net/ersaticaret?retryWrites=true&w=majority&appName=affanccn';
const uri = process.env.MONGODB_URI || fallbackUri;

if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = uri;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: uri
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
