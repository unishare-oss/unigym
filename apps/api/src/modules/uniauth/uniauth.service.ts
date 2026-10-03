import { Injectable } from '@nestjs/common';
import { UNIAUTH_PROVIDER_ID } from '../../auth/auth.config.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/** Applies uniAuth events to Unigym's copy of a person. An unknown sub is a no-op. */
@Injectable()
export class UniauthService {
  constructor(private readonly prisma: PrismaService) {}

  /** Back-channel logout: uniAuth signed the person out everywhere. */
  async endSessions(sub: string) {
    const userId = await this.userIdFor(sub);
    if (userId) await this.prisma.session.deleteMany({ where: { userId } });
  }

  /** Accounts and sessions go with the user (onDelete: Cascade). */
  async deleteUser(sub: string) {
    const userId = await this.userIdFor(sub);
    // Add cleanup for future gym tables here if they don't cascade from user.
    if (userId) await this.prisma.user.deleteMany({ where: { id: userId } });
  }

  async updateUser(sub: string, data: Record<string, unknown>) {
    const userId = await this.userIdFor(sub);
    if (!userId) return;
    const { name, email, email_verified, picture } = data;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        // No picture = avatar removed.
        image: typeof picture === 'string' && picture ? picture : null,
        ...(typeof name === 'string' && name && { name }),
        ...(typeof email === 'string' &&
          email && { email: email.toLowerCase() }),
        ...(typeof email_verified === 'boolean' && {
          emailVerified: email_verified,
        }),
      },
    });
  }

  /** Never by email: the uniAuth sub on the account row is the only link. */
  private async userIdFor(sub: string) {
    const account = await this.prisma.account.findUnique({
      where: {
        providerId_accountId: {
          providerId: UNIAUTH_PROVIDER_ID,
          accountId: sub,
        },
      },
      select: { userId: true },
    });
    return account?.userId;
  }
}
