import { PrismaClient } from '@prisma/client';
import { config } from './index';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isDevelopment() ? ['query', 'error', 'warn'] : ['error'],
  });

if (!config.isProduction()) {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('Database connected successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  // eslint-disable-next-line no-console
  console.log('Database disconnected');
}
