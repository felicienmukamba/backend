import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class TenancyGuard implements CanActivate {
    constructor(private readonly cls: ClsService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const branchHeader = request.headers['x-branch-id'];

        if (user && user.companyId) {
            this.cls.set('companyId', user.companyId);
            this.cls.set('user', user);

            // SECURITY: If user has a fixed branchId (Branch Admin), always use it.
            // Only users with NO fixed branchId (Company Admins) can use the header.
            if (user.branchId) {
                this.cls.set('branchId', user.branchId);
            } else if (branchHeader) {
                this.cls.set('branchId', Number(branchHeader));
            } else {
                this.cls.set('branchId', null); // Global view for Super Admin (Company Level)
            }
        }

        return true;
    }
}
