import {
  ForbiddenException,
  Injectable,
  SetMetadata,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const SKIP_CONSENT = 'SKIP_CONSENT';

/** Lets a signed-in user reach the route before accepting Unigym's terms. */
export const SkipConsent = () => SetMetadata(SKIP_CONSENT, true);

/**
 * Signing in through uniAuth is not agreeing to Unigym's terms. Blocks every protected route
 * with 403 consent_required until the user has accepted them. Runs after the session guard,
 * which puts the user on the request. Routes with @AllowAnonymous() are skipped.
 */
@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (
      this.reflector.getAllAndOverride<boolean>('PUBLIC', targets) ||
      this.reflector.getAllAndOverride<boolean>(SKIP_CONSENT, targets)
    )
      return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { consentGivenAt?: Date | null } | null }>();
    // No user: the session guard has already answered 401, or the route allows anonymous use.
    if (user && !user.consentGivenAt) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'consent_required',
        message: "Accept Unigym's Terms and Privacy Policy first",
      });
    }
    return true;
  }
}
