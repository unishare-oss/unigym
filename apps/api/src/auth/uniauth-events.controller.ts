import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { PrismaService } from '../db/prisma.service.js';
import { AuthService } from './auth.service.js';
import {
  LOGOUT_EVENT,
  USER_DELETED_EVENT,
  USER_UPDATED_EVENT,
  verifyUniauthEvent,
  type UniauthEvent,
} from './uniauth-event-token.js';

@Controller('api/uniauth')
export class UniauthEventsController {
  private readonly logger = new Logger(UniauthEventsController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  private async event(token: unknown, expected: UniauthEvent) {
    const verified = await verifyUniauthEvent(
      typeof token === 'string' ? token : '',
      expected,
    );
    if (!verified)
      throw new HttpException('invalid token', HttpStatus.BAD_REQUEST);
    return verified;
  }

  @Post('backchannel-logout')
  @HttpCode(200)
  async logout(@Body() body: Record<string, unknown>) {
    const event = await this.event(body?.logout_token, LOGOUT_EVENT);
    const userId = await this.auth.localUserId(event.sub);
    if (userId) await this.prisma.session.deleteMany({ where: { userId } });
  }

  @Post('user-deleted')
  @HttpCode(200)
  async deleted(@Body() body: Record<string, unknown>) {
    const event = await this.event(body?.token, USER_DELETED_EVENT);
    const userId = await this.auth.localUserId(event.sub);
    if (userId) {
      await this.prisma.user.deleteMany({ where: { id: userId } });
      this.logger.log(`Removed local user ${userId} after uniAuth deletion`);
    }
  }

  @Post('user-updated')
  @HttpCode(200)
  async updated(@Body() body: Record<string, unknown>) {
    const event = await this.event(body?.token, USER_UPDATED_EVENT);
    const userId = await this.auth.localUserId(event.sub);
    if (!userId) return;
    const { name, picture, email, email_verified } = event.data;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(typeof name === 'string' && name ? { name } : {}),
        ...(Object.hasOwn(event.data, 'picture')
          ? { image: typeof picture === 'string' ? picture : null }
          : {}),
        ...(typeof email === 'string' && email
          ? { email: email.toLowerCase() }
          : {}),
        ...(typeof email_verified === 'boolean'
          ? { emailVerified: email_verified }
          : {}),
      },
    });
  }
}
