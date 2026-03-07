import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing token");
    }

    const token = authHeader.slice(7);
    const payload = await this.authService.verifyToken(token);

    // Resolve Supabase user to local Prisma User (find-or-create)
    const user = await this.authService.findOrCreateUser(
      payload.sub,
      payload.email,
      payload.user_metadata?.name
    );
    request.userId = user.id;
    return true;
  }
}
