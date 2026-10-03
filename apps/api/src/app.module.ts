import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { auth } from './auth/auth.config.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  // AuthModule mounts Better Auth at /api/auth/* and guards every route by default.
  // Public routes opt out with @AllowAnonymous().
  imports: [AuthModule.forRoot({ auth }), PrismaModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
