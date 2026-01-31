import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdministrationModule } from './modules/administration/administration.module';
import { SalesModule } from './modules/sales/sales.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { SyncModule } from './modules/sync/sync.module';
import { HRModule } from './modules/hr/hr.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { BudgetingModule } from './modules/budgeting/budgeting.module';
import { PlatformModule } from './modules/saas/platform.module';
import { LoggerModule } from './common/logger/logger.module';
import { CommonModule } from './common/common.module';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TenancyGuard } from './common/guards/tenancy.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 5,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    ConfigModule,
    CommonModule,
    LoggerModule,
    PrismaModule,
    AuthModule,
    AdministrationModule,
    SalesModule,
    AccountingModule,
    ResourcesModule,
    SyncModule,
    HRModule,
    ProcurementModule,
    BudgetingModule,
    PlatformModule,
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenancyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
