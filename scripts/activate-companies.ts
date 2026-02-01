
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.company.updateMany({
        data: {
            isActive: true
        }
    });

    console.log(`✅ Activated ${result.count} companies.`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
