import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Records consent once. A second call keeps the first timestamp. */
  async giveConsent(userId: string) {
    await this.prisma.user.updateMany({
      where: { id: userId, consentGivenAt: null },
      data: { consentGivenAt: new Date() },
    });
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { consentGivenAt: true },
    });
  }
}
