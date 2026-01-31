import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { PrismaService } from './prisma.service';
import { createExtendedPrismaClient } from './extended-client';

@Global()
@Module({
    providers: [
        {
            provide: PrismaService,
            useFactory: (cls: ClsService) => {
                const client = new PrismaClient();
                const extended = createExtendedPrismaClient(client, cls);

                // Bind lifecycle hooks to the original client but return the extended one
                (extended as any).onModuleInit = async () => {
                    await client.$connect();
                };
                (extended as any).onModuleDestroy = async () => {
                    await client.$disconnect();
                };

                return extended;
            },
            inject: [ClsService],
        }
    ],
    exports: [PrismaService],
})
export class PrismaModule { }
