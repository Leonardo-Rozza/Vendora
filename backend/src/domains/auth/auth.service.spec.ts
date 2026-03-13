import assert from 'node:assert/strict';
import test from 'node:test';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';

test('AuthService bootstraps the initial admin and returns an admin session on valid login', async () => {
  const calls: Record<string, unknown> = {};
  let storedAdmin: {
    id: string;
    email: string;
    role: UserRole;
    passwordHash: string | null;
  } | null = null;
  const service = new AuthService(
    {
      findAdminByEmail: async (email: string) => {
        calls.findAdminByEmail = email;
        return storedAdmin;
      },
      upsertInitialAdmin: async (input: {
        email: string;
        passwordHash: string;
      }) => {
        calls.upsertInitialAdmin = input.email;
        storedAdmin = {
          id: 'admin-1',
          email: input.email,
          role: UserRole.ADMIN,
          passwordHash: input.passwordHash,
        };
        return storedAdmin;
      },
      findById: async (id: string) =>
        storedAdmin && storedAdmin.id === id ? storedAdmin : null,
    } as never,
    {
      initialAdminEmail: 'ops@vendora.local',
      initialAdminPassword: 'vendora-admin-pass',
      adminSessionSecret: 'test-secret',
      adminSessionCookieName: 'vendora_admin_session',
      adminSessionTtlMs: 60 * 60 * 1000,
      environment: 'test',
    } as never,
  );

  const session = await service.login(
    'ops@vendora.local',
    'vendora-admin-pass',
  );
  const response = {
    cookie: (name: string, value: string) => {
      calls.cookieName = name;
      calls.cookieValue = value;
    },
  } as never;

  service.writeSessionCookie(response, session);

  const resolvedSession = await service.resolveAdminSession({
    headers: {
      cookie: `vendora_admin_session=${calls.cookieValue}`,
    },
  } as never);

  assert.equal(calls.upsertInitialAdmin, 'ops@vendora.local');
  assert.equal(session.email, 'ops@vendora.local');
  assert.equal(session.role, 'ADMIN');
  assert.equal(calls.cookieName, 'vendora_admin_session');
  assert.equal(resolvedSession?.userId, 'admin-1');
});

test('AuthService rejects invalid admin credentials', async () => {
  const service = new AuthService(
    {
      findAdminByEmail: async () => ({
        id: 'admin-1',
        email: 'ops@vendora.local',
        role: UserRole.ADMIN,
        passwordHash:
          'c2FsdA==:M7fd+g7qRjQHag8Q60M9IYdP8cse2bzbWJ5R2yB0e2XKekuxn68mSifh4PAnx+5fZo6d0oQnLkI2y0QLXATKsw==',
      }),
      upsertInitialAdmin: async () => undefined,
      findById: async () => null,
    } as never,
    {
      initialAdminEmail: null,
      initialAdminPassword: null,
      adminSessionSecret: 'test-secret',
      adminSessionCookieName: 'vendora_admin_session',
      adminSessionTtlMs: 60 * 60 * 1000,
      environment: 'test',
    } as never,
  );

  await assert.rejects(
    () => service.login('ops@vendora.local', 'wrong-password'),
    (error: unknown) => error instanceof UnauthorizedException,
  );
});
