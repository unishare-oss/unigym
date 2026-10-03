import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { UNIAUTH_CLIENT_ID, UNIAUTH_ISSUER } from '../../auth/auth.config.js';
import {
  createEventVerifier,
  LOGOUT_EVENT,
  USER_DELETED_EVENT,
  USER_UPDATED_EVENT,
} from './uniauth-event-token.js';
import { UniauthService } from './uniauth.service.js';

const verifyEvent = createEventVerifier(UNIAUTH_ISSUER, UNIAUTH_CLIENT_ID);

/** Server-to-server form POSTs from uniAuth. The signed token is the authentication. */
@Controller('api/uniauth')
@AllowAnonymous()
export class UniauthController {
  constructor(private readonly uniauth: UniauthService) {}

  @Post('backchannel-logout')
  @HttpCode(200)
  async logout(@Body('logout_token') token: unknown) {
    const { sub } = await this.verify(token, LOGOUT_EVENT);
    await this.uniauth.endSessions(sub);
  }

  @Post('user-deleted')
  @HttpCode(200)
  async userDeleted(@Body('token') token: unknown) {
    const { sub } = await this.verify(token, USER_DELETED_EVENT);
    await this.uniauth.deleteUser(sub);
  }

  @Post('user-updated')
  @HttpCode(200)
  async userUpdated(@Body('token') token: unknown) {
    const { sub, data } = await this.verify(token, USER_UPDATED_EVENT);
    await this.uniauth.updateUser(sub, data);
  }

  private async verify(token: unknown, event: string) {
    const verified =
      typeof token === 'string' ? await verifyEvent(token, event) : null;
    if (!verified) throw new BadRequestException('invalid token');
    return verified;
  }
}
