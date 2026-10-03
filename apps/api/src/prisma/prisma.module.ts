import { Module } from '@nestjs/common';
import { prisma } from '../auth/auth.config.js';
import { PrismaService } from './prisma.service.js';

@Module({
  providers: [{ provide: PrismaService, useValue: prisma }],
  exports: [PrismaService],
})
export class PrismaModule {}
