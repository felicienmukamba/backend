import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
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

        // Get required permissions from decorator
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true; // No specific permissions required
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role || !user.role.permissions) {
            throw new ForbiddenException('Permissions insuffisantes');
        }

        // user.role.permissions is a JSON array of permission strings
        const userPermissions: string[] = Array.isArray(user.role.permissions)
            ? user.role.permissions
            : [];

        const hasPermission = requiredPermissions.every((permission) =>
            userPermissions.includes(permission)
        );

        if (!hasPermission) {
            throw new ForbiddenException(`Permissions requises: ${requiredPermissions.join(', ')}`);
        }

        return true;
    }
}
