import { Controller, Get } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

@Controller('api')
export class UsersController {
  @Get('me')
  getMe(@Session() { user }: UserSession) {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      image: user.image ?? null,
    };
  }
}
