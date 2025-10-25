import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let prisma: PrismaClient | null = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });

    // Test the connection
    await prisma.$connect();
    await prisma.$queryRaw`SELECT NOW()`;

    logger.info(`Database connected successfully at ${new Date().toISOString()}`);
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const getPrisma = (): PrismaClient => {
  if (!prisma) {
    throw new Error('Prisma client not initialized. Call connectDatabase() first.');
  }
  return prisma;
};

export const closeDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  }
};

export { prisma };
