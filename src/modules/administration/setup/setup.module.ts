import { Module } from '@nestjs/common';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';
import { SystemSetupController } from './system-setup.controller';
import { SystemSetupService } from './system-setup.service';

@Module({
    controllers: [SetupController, SystemSetupController],
    providers: [SetupService, SystemSetupService],
})
export class SetupModule { }
