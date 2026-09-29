import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

/** Apply to gym endpoints that require accepted Unigym terms. */
@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const session = await this.auth.getSession(request.headers);
    if (!session) throw new UnauthorizedException();
    if (!session.user.consentGivenAt)
      throw new ForbiddenException('consent_required');
    return true;
  }
}
