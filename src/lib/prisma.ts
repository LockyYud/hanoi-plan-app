import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Create Prisma client with connection timeout and error handling
let prisma: PrismaClient | null = null;

try {
    if (!globalForPrisma.prisma) {
        // Only create client if DATABASE_URL exists and looks valid
        if (process.env.DATABASE_URL && 
            process.env.DATABASE_URL !== 'file:./dev.db' && 
            process.env.DATABASE_URL.includes('://')) {
            
            globalForPrisma.prisma = new PrismaClient({
                log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
                errorFormat: 'pretty',
                datasources: {
                    db: {
                        url: process.env.DATABASE_URL,
                    },
                },
            });
        }
    }
    prisma = globalForPrisma.prisma || null;
} catch (error) {
    console.warn('Prisma client initialization failed:', error);
    prisma = null;
}

export { prisma }

// Helper function to check if database is available
export async function isDatabaseAvailable(): Promise<boolean> {
    if (!prisma) return false;
    
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.warn('Database connection check failed:', error);
        return false;
    }
}
