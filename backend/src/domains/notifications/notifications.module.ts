import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailNotificationProvider } from './providers/email-notification.provider';

@Module({
  providers: [NotificationsService, EmailNotificationProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
