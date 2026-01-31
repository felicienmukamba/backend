import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { HRController } from './hr.controller';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { CacheConfigModule } from '../../common/cache/cache.module';
import { CacheService } from '../../common/cache/cache.service';
import { ImportService } from '../../common/import/import.service';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { PayrollController } from './payroll.controller';
import { PrismaModule } from '../../prisma/prisma.module';

import { EntriesModule } from '../accounting/entries/entries.module';
import { ClsModule } from 'nestjs-cls';

@Module({
    imports: [CacheConfigModule, PrismaModule, EntriesModule, ClsModule],
    providers: [
        PayrollService,
        EmployeesService,
        CacheService,
        ImportService,
        DepartmentService,
        LeaveService,
        AttendanceService
    ],
    controllers: [
        HRController,
        EmployeesController,
        DepartmentController,
        LeaveController,
        AttendanceController
    ],
    exports: [PayrollService, EmployeesService]
})
export class HRModule { }

