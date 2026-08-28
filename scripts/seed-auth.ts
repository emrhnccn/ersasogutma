import { loadEnvConfig } from '@next/env';
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding authentication data...');

  // Create or update Demo Bayi
  const bayiPassword = await bcrypt.hash('bayi.test1', 10);
  const bayi = await prisma.user.upsert({
    where: { username: 'bayitest' },
    update: {
      passwordHash: bayiPassword,
      role: 'B2B_DEALER',
      name: 'Test Bayi A.Ş.',
    },
    create: {
      username: 'bayitest',
      email: 'bayi@ersasogutma.com.test', // mock email
      passwordHash: bayiPassword,
      role: 'B2B_DEALER',
      name: 'Test Bayi A.Ş.',
      status: 'ACTIVE',
    },
  });
  console.log('Bayi created/updated:', bayi.username);

  // Create or update Demo Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'ersaticaret' },
    update: {
      passwordHash: adminPassword,
      role: 'ADMIN',
      name: 'Sistem Yöneticisi',
    },
    create: {
      username: 'ersaticaret',
      email: 'admin@ersasogutma.com.test', // mock email
      passwordHash: adminPassword,
      role: 'ADMIN',
      name: 'Sistem Yöneticisi',
      status: 'ACTIVE',
    },
  });
  console.log('Admin created/updated:', admin.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
