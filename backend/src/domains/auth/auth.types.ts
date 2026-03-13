import type { Request } from 'express';

export type AdminSession = {
  userId: string;
  email: string;
  role: 'ADMIN';
  expiresAt: string;
};

export type AdminRequest = Request & {
  adminSession?: AdminSession;
};
