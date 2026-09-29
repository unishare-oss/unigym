import type { INestApplication } from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import { json, urlencoded } from 'express';
import { AuthService } from './auth/auth.service.js';

export function configureApp(app: INestApplication): void {
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all('/api/auth/*splat', toNodeHandler(app.get(AuthService).auth));
  expressApp.use(json());
  expressApp.use(urlencoded({ extended: false }));
}
