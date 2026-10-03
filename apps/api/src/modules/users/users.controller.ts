import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { SkipConsent } from '../../auth/consent.guard.js';
import { UsersService } from './users.service.js';

/** The session user, with Unigym's additional field. */
type User = UserSession['user'] & { consentGivenAt?: Date | null };

@Controller('api')
@SkipConsent()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  getMe(@Session() session: UserSession) {
    const user = session.user as User;
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      image: user.image ?? null,
      consentGivenAt: user.consentGivenAt ?? null,
    };
  }

  @Post('users/me/consent')
  @HttpCode(200)
  giveConsent(@Session() { user }: UserSession) {
    return this.users.giveConsent(user.id);
  }
}
