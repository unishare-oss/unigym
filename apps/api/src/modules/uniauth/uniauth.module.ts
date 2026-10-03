import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { UniauthController } from './uniauth.controller.js';
import { UniauthService } from './uniauth.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [UniauthController],
  providers: [UniauthService],
})
export class UniauthModule {}
