import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";

export interface AuthenticatedRequest extends Request {
  /** Local User id, set by AuthGuard. */
  userId: string;
}

/**
 * Requires `Authorization: Bearer <Supabase access token>` and sets
 * `request.userId`. 401 for a missing, invalid or expired token; 503 when
 * the signing keys cannot be fetched (clients should retry, not sign out).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = bearerToken(request.headers.authorization);
    if (!token) throw new UnauthorizedException("Missing token");
    request.userId = await this.authService.authenticate(token);
    return true;
  }
}

function bearerToken(header: string | undefined): string | null {
  const match = header ? /^Bearer +(\S+)$/i.exec(header.trim()) : null;
  return match ? match[1] : null;
}
