import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ExtendedPrismaClient } from './extended-client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // These methods are implemented by the object returned from the factory,
  // which wraps the extended client.
  async onModuleInit() { }
  async onModuleDestroy() { }
}

// Merge the type so that 'PrismaService' in usage has the methods of ExtendedPrismaClient
export interface PrismaService extends ExtendedPrismaClient { }
