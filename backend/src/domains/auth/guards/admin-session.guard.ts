import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '../../../platform/config/app-config.service';
import { AuthService } from '../auth.service';
import type { AdminRequest } from '../auth.types';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const adminSession = await this.authService.resolveAdminSession(request);

    if (!adminSession) {
      throw new UnauthorizedException('Admin authentication is required');
    }

    // CSRF defense: state-changing requests carrying the session cookie must
    // originate from an allowed frontend. Safe (read-only) methods are exempt.
    if (!SAFE_METHODS.has(request.method.toUpperCase())) {
      const origin = request.headers.origin;

      if (!this.configService.isAllowedMutationOrigin(origin)) {
        throw new ForbiddenException('Request origin is not allowed');
      }
    }

    request.adminSession = adminSession;
    return true;
  }
}
