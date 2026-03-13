import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminSessionGuard } from './guards/admin-session.guard';
import { AuthService } from './auth.service';
import type { AdminSession } from './auth.types';

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: AdminLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(body.email, body.password);
    this.authService.writeSessionCookie(response, session);
    return session;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    this.authService.clearSessionCookie(response);
    return { success: true };
  }

  @Get('me')
  @UseGuards(AdminSessionGuard)
  getCurrentAdmin(@CurrentAdmin() admin: AdminSession) {
    return admin;
  }
}
