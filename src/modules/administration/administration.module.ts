import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { CompaniesModule } from './companies/companies.module';
import { BranchesModule } from './branches/branches.module';
import { LegalModule } from './legal/legal.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { SetupModule } from './setup/setup.module';

@Module({
    imports: [UsersModule, RolesModule, CompaniesModule, BranchesModule, LegalModule, AuditLogsModule, SetupModule],
    exports: [UsersModule, RolesModule, CompaniesModule, BranchesModule, LegalModule, AuditLogsModule, SetupModule],
})
export class AdministrationModule { }
