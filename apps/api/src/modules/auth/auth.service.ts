import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import { PrismaService } from "../../common/prisma.service";
import type { EnvConfig } from "../../common/env.config";

interface SupabaseJwtPayload {
  sub: string;
  email: string;
  user_metadata?: { name?: string };
}

@Injectable()
export class AuthService {
  private readonly jwksClient: jwksRsa.JwksClient | null;
  private readonly jwtSecret: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<EnvConfig>
  ) {
    const supabaseUrl = this.config.get("SUPABASE_URL");
    this.jwtSecret = this.config.get("SUPABASE_JWT_SECRET");

    this.jwksClient = supabaseUrl
      ? jwksRsa({
          jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
        })
      : null;
  }

  private async getSigningKey(header: jwt.JwtHeader): Promise<string> {
    if (!this.jwksClient) {
      throw new Error("JWKS client not initialised – set SUPABASE_URL");
    }
    const key = await this.jwksClient.getSigningKey(header.kid);
    return key.getPublicKey();
  }

  /**
   * Verify the Supabase-issued JWT and return the payload.
   * Supports both HS256 (older projects) and ES256 (newer projects via JWKS).
   */
  async verifyToken(token: string): Promise<SupabaseJwtPayload> {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) throw new UnauthorizedException("Invalid token");

    const alg = decoded.header.alg;

    try {
      if (alg === "ES256") {
        const publicKey = await this.getSigningKey(decoded.header);
        return jwt.verify(token, publicKey, {
          algorithms: ["ES256"],
        }) as SupabaseJwtPayload;
      } else {
        if (!this.jwtSecret) {
          throw new Error("SUPABASE_JWT_SECRET env var is not set");
        }
        return jwt.verify(token, this.jwtSecret, {
          algorithms: ["HS256"],
        }) as SupabaseJwtPayload;
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException("Invalid token");
    }
  }

  /**
   * Find-or-create the local User row linked to a Supabase auth user.
   * Called on every authenticated request via GET /auth/me and the guard.
   */
  async findOrCreateUser(supabaseId: string, email: string, name?: string) {
    let user = await this.prisma.user.findUnique({ where: { supabaseId } });

    if (!user) {
      // Also check by email for legacy/seeded users and link them
      user = await this.prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { supabaseId },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            supabaseId,
            email,
            name: name ?? email.split("@")[0],
          },
        });
      }
    }

    return user;
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User not found");
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isPremium: user.isPremium,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    };
  }
}
