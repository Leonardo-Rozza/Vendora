import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AdminRequest } from '../auth.types';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    return request.adminSession ?? null;
  },
);
