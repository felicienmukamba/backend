
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            company: {
                select: {
                    id: true,
                    companyName: true,
                    isActive: true
                }
            }
        }
    });

    console.log('--- USERS ---');
    users.forEach(u => {
        console.log(`ID: ${u.id}, Email: ${u.email}, Active: ${u.isActive}, Company: ${u.company?.companyName} (Active: ${u.company?.isActive})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
