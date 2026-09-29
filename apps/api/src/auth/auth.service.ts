import { Injectable } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { PrismaService } from '../db/prisma.service.js';
import { createAuth } from './auth.factory.js';

@Injectable()
export class AuthService {
  readonly auth;

  constructor(private readonly prisma: PrismaService) {
    this.auth = createAuth(prisma);
  }

  getSession(headers: IncomingHttpHeaders) {
    return this.auth.api.getSession({ headers: fromNodeHeaders(headers) });
  }

  async localUserId(sub: string): Promise<string | null> {
    const account = await this.prisma.account.findFirst({
      where: { providerId: 'uniauth', accountId: sub },
      select: { userId: true },
    });
    return account?.userId ?? null;
  }
}
