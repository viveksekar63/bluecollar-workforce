import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import {
  PERMISSIONS_KEY,
} from "./permission.decorator";

import {
  PermissionService,
} from "./permission.service";

@Injectable()
export class PermissionGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const permissions =
      this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    // No permission requirement
    if (
      !permissions ||
      permissions.length === 0
    ) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    const user = request.user;

    if (!user?.userId) {
      throw new ForbiddenException(
        "User authentication required",
      );
    }

    const hasPermission =
      await this.permissionService.hasAnyPermission(
        user.userId,
        permissions,
      );

    if (!hasPermission) {
      throw new ForbiddenException(
        "Insufficient permissions",
      );
    }

    return true;
  }
}