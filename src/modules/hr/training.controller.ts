import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateTrainingDomainDto, CreateTrainingDto, CreateParticipationDto } from './dto/training.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClsService } from 'nestjs-cls';

@ApiTags('HR - Training')
@Controller('trainings')
export class TrainingController {
    constructor(
        private readonly trainingService: TrainingService,
        private readonly cls: ClsService,
    ) { }

    // --- Domains ---
    @Post('domains')
    @ApiOperation({ summary: 'Create Training Domain' })
    createDomain(@Body() dto: CreateTrainingDomainDto) {
        const companyId = this.cls.get('companyId');
        return this.trainingService.createDomain(dto, companyId);
    }

    findAllDomains() {
        const companyId = this.cls.get('companyId');
        return this.trainingService.findAllDomains(companyId);
    }

    @Delete('domains/:id')
    @ApiOperation({ summary: 'Delete Training Domain' })
    removeDomain(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.trainingService.removeDomain(id, companyId);
    }

    // --- Trainings ---
    @Post()
    @ApiOperation({ summary: 'Create Training' })
    createTraining(@Body() dto: CreateTrainingDto) {
        const companyId = this.cls.get('companyId');
        return this.trainingService.createTraining(dto, companyId);
    }

    findAllTrainings() {
        const companyId = this.cls.get('companyId');
        return this.trainingService.findAllTrainings(companyId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete Training' })
    removeTraining(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.trainingService.removeTraining(id, companyId);
    }

    // --- Participation ---
    @Post('participations')
    @ApiOperation({ summary: 'Add Employee to Training' })
    addParticipation(@Body() dto: CreateParticipationDto) {
        const companyId = this.cls.get('companyId');
        return this.trainingService.addParticipation(dto, companyId);
    }

    findAllParticipations(@Query('trainingId') trainingId?: string) {
        const companyId = this.cls.get('companyId');
        return this.trainingService.findAllParticipations(companyId, trainingId);
    }

    @Delete('participations/:id')
    @ApiOperation({ summary: 'Remove Employee from Training' })
    removeParticipation(@Param('id') id: string) {
        const companyId = this.cls.get('companyId');
        return this.trainingService.removeParticipation(id, companyId);
    }
}
