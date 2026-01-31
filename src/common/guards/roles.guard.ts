import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Check if route is public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        // Get required roles from decorator
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // No specific roles required
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.roleCode) {
            throw new ForbiddenException('Rôle insuffisant');
        }

        const hasRole = requiredRoles.includes(user.roleCode);

        if (!hasRole) {
            throw new ForbiddenException(`Rôles requis: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}
