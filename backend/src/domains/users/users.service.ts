import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../platform/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        orders: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findAdminByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        role: UserRole.ADMIN,
      },
    });
  }

  upsertInitialAdmin(input: { email: string; passwordHash: string }) {
    return this.prisma.user.upsert({
      where: { email: input.email },
      update: {
        role: UserRole.ADMIN,
        passwordHash: input.passwordHash,
      },
      create: {
        email: input.email,
        role: UserRole.ADMIN,
        passwordHash: input.passwordHash,
      },
    });
  }
}
