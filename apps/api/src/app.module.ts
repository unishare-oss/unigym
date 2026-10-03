import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { auth } from './auth/auth.config.js';
import { ConsentGuard } from './auth/consent.guard.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UniauthModule } from './modules/uniauth/uniauth.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  // AuthModule mounts Better Auth at /api/auth/*. Every route needs a session and consent
  // unless it opts out with @AllowAnonymous() or @SkipConsent().
  imports: [
    AuthModule.forRoot({ auth, disableGlobalAuthGuard: true }),
    PrismaModule,
    UsersModule,
    UniauthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards run in this order: the session guard puts the user on the request,
    // then ConsentGuard reads it.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ConsentGuard },
  ],
})
export class AppModule {}
