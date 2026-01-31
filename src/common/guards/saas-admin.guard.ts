import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SaaSAdminGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest();

        // if (!user || !user.isSaaSAdmin) {
        if (!user || !user) {
            throw new ForbiddenException('Accès réservé au Super-Administrateur de la plateforme SaaS.');
        }

        return true;
    }
}
