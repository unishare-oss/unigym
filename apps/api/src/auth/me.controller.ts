import {
  Controller,
  Get,
  Post,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../db/prisma.service.js';
import { AuthService } from './auth.service.js';
import { ConsentGuard } from './consent.guard.js';

@Controller('api')
export class MeController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  async me(@Req() request: Request) {
    const session = await this.auth.getSession(request.headers);
    if (!session) throw new UnauthorizedException();
    return session.user;
  }

  @Post('users/me/consent')
  async consent(@Req() request: Request) {
    if (process.env.UNIGYM_LEGAL_APPROVED !== 'true') {
      throw new ServiceUnavailableException(
        'Unigym legal terms are awaiting approval',
      );
    }
    const session = await this.auth.getSession(request.headers);
    if (!session) throw new UnauthorizedException();
    const user = await this.prisma.user.update({
      where: { id: session.user.id },
      data: { consentGivenAt: session.user.consentGivenAt ?? new Date() },
      select: { consentGivenAt: true },
    });
    return user;
  }

  @Get('legal/status')
  legalStatus() {
    return { approved: process.env.UNIGYM_LEGAL_APPROVED === 'true' };
  }

  @Get('profile')
  @UseGuards(ConsentGuard)
  async profile(@Req() request: Request) {
    const session = await this.auth.getSession(request.headers);
    return session!.user;
  }
}
