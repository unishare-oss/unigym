import { Module } from '@nestjs/common';
import { PrismaModule } from '../db/prisma.module.js';
import { AuthService } from './auth.service.js';
import { MeController } from './me.controller.js';
import { UniauthEventsController } from './uniauth-events.controller.js';
import { ConsentGuard } from './consent.guard.js';

@Module({
  imports: [PrismaModule],
  controllers: [MeController, UniauthEventsController],
  providers: [AuthService, ConsentGuard],
  exports: [AuthService, ConsentGuard],
})
export class AuthModule {}
