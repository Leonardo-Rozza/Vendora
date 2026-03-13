import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHmac,
} from 'node:crypto';
import { promisify } from 'node:util';
import type { Request, Response } from 'express';
import { AppConfigService } from '../../platform/config/app-config.service';
import { UsersService } from '../users/users.service';
import type { AdminSession } from './auth.types';

const scrypt = promisify(scryptCallback);

type PersistedAdmin = {
  id: string;
  email: string;
  role: UserRole;
  passwordHash: string | null;
};

type SessionPayload = {
  userId: string;
  email: string;
  role: 'ADMIN';
  expiresAt: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: AppConfigService,
  ) {}

  async login(email: string, password: string): Promise<AdminSession> {
    await this.ensureBootstrappedAdmin();

    const admin = await this.usersService.findAdminByEmail(
      email.trim().toLowerCase(),
    );

    if (!admin?.passwordHash) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const isValidPassword = await verifyPassword(password, admin.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    return this.toAdminSession(admin);
  }

  async resolveAdminSession(request: Request): Promise<AdminSession | null> {
    const token = this.readSessionCookie(request);

    if (!token) {
      return null;
    }

    const payload = this.verifySessionToken(token);

    if (!payload) {
      return null;
    }

    const admin = await this.usersService.findById(payload.userId);

    if (!admin || admin.role !== UserRole.ADMIN) {
      return null;
    }

    return this.toAdminSession(admin, payload.expiresAt);
  }

  writeSessionCookie(response: Response, session: AdminSession) {
    response.cookie(
      this.configService.adminSessionCookieName,
      this.signSessionToken(session),
      {
        httpOnly: true,
        sameSite: this.configService.adminSessionCookieSameSite,
        secure: this.configService.environment === 'production',
        path: '/',
        maxAge: this.configService.adminSessionTtlMs,
      },
    );
  }

  clearSessionCookie(response: Response) {
    response.clearCookie(this.configService.adminSessionCookieName, {
      httpOnly: true,
      sameSite: this.configService.adminSessionCookieSameSite,
      secure: this.configService.environment === 'production',
      path: '/',
    });
  }

  async ensureBootstrappedAdmin() {
    const initialAdminEmail = this.configService.initialAdminEmail;
    const initialAdminPassword = this.configService.initialAdminPassword;

    if (!initialAdminEmail || !initialAdminPassword) {
      return;
    }

    const existingAdmin =
      await this.usersService.findAdminByEmail(initialAdminEmail);

    if (existingAdmin) {
      return;
    }

    const passwordHash = await hashPassword(initialAdminPassword);

    await this.usersService.upsertInitialAdmin({
      email: initialAdminEmail,
      passwordHash,
    });
  }

  private readSessionCookie(request: Request) {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return null;
    }

    const cookieKey = `${this.configService.adminSessionCookieName}=`;
    const cookieEntry = cookieHeader
      .split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith(cookieKey));

    if (!cookieEntry) {
      return null;
    }

    return decodeURIComponent(cookieEntry.slice(cookieKey.length));
  }

  private signSessionToken(session: AdminSession) {
    const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
    const signature = createHmac(
      'sha256',
      this.configService.adminSessionSecret,
    )
      .update(payload)
      .digest('base64url');

    return `${payload}.${signature}`;
  }

  private verifySessionToken(token: string): SessionPayload | null {
    const [payload, signature] = token.split('.');

    if (!payload || !signature) {
      return null;
    }

    const expectedSignature = createHmac(
      'sha256',
      this.configService.adminSessionSecret,
    )
      .update(payload)
      .digest();
    const receivedSignature = Buffer.from(signature, 'base64url');

    if (
      expectedSignature.length !== receivedSignature.length ||
      !timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return null;
    }

    try {
      const parsedPayload = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as SessionPayload;

      if (
        parsedPayload.role !== 'ADMIN' ||
        !parsedPayload.userId ||
        !parsedPayload.email ||
        !parsedPayload.expiresAt
      ) {
        return null;
      }

      if (new Date(parsedPayload.expiresAt).getTime() <= Date.now()) {
        return null;
      }

      return parsedPayload;
    } catch {
      return null;
    }
  }

  private toAdminSession(
    admin: PersistedAdmin,
    expiresAt?: string,
  ): AdminSession {
    if (admin.role !== UserRole.ADMIN) {
      throw new ConflictException(`User ${admin.email} is not an admin`);
    }

    return {
      userId: admin.id,
      email: admin.email,
      role: 'ADMIN',
      expiresAt:
        expiresAt ??
        new Date(
          Date.now() + this.configService.adminSessionTtlMs,
        ).toISOString(),
    };
  }
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString('base64')}:${derivedKey.toString('base64')}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [saltValue, keyValue] = storedHash.split(':');

  if (!saltValue || !keyValue) {
    return false;
  }

  const salt = Buffer.from(saltValue, 'base64');
  const expectedKey = Buffer.from(keyValue, 'base64');
  const actualKey = (await scrypt(
    password,
    salt,
    expectedKey.length,
  )) as Buffer;

  return timingSafeEqual(expectedKey, actualKey);
}
