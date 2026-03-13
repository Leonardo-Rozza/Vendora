import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import type { AdminRequest } from '../auth.types';

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const adminSession = await this.authService.resolveAdminSession(request);

    if (!adminSession) {
      throw new UnauthorizedException('Admin authentication is required');
    }

    request.adminSession = adminSession;
    return true;
  }
}
