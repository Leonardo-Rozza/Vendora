import { Global, Module } from '@nestjs/common';
import { PlatformConfigModule } from '../../platform/config/platform-config.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminSessionGuard } from './guards/admin-session.guard';

@Global()
@Module({
  imports: [PlatformConfigModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, AdminSessionGuard],
  exports: [AuthService, AdminSessionGuard],
})
export class AuthModule {}
