import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvConfig } from "../../common/env.config";

const REQUEST_TIMEOUT_MS = 10_000;

export type DeleteAuthUserResult =
  | "deleted"
  | "not_configured"
  | { failed: string };

export interface DeleteAuthUserParams {
  supabaseUrl: string;
  serviceRoleKey: string;
  supabaseId: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * Supabase admin API: DELETE /auth/v1/admin/users/{id}. A user that is
 * already gone (404) counts as deleted. Never throws.
 */
export async function deleteSupabaseAuthUser({
  supabaseUrl,
  serviceRoleKey,
  supabaseId,
  fetchImpl = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS,
}: DeleteAuthUserParams): Promise<DeleteAuthUserResult> {
  try {
    const res = await fetchImpl(
      `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(supabaseId)}`,
      {
        method: "DELETE",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    if (res.ok || res.status === 404) return "deleted";
    return { failed: `HTTP ${res.status}` };
  } catch (err) {
    return { failed: err instanceof Error ? err.name : "unknown error" };
  }
}

/**
 * Deletes the Supabase auth identity of a deleted account, when
 * SUPABASE_SERVICE_ROLE_KEY is configured. Without it the identity survives
 * and signing in again starts a new, empty account.
 */
@Injectable()
export class SupabaseAdminClient {
  private readonly logger = new Logger(SupabaseAdminClient.name);
  private readonly supabaseUrl: string | undefined;
  private readonly serviceRoleKey: string | undefined;

  constructor(config: ConfigService<EnvConfig, true>) {
    this.supabaseUrl = config.get("SUPABASE_URL", { infer: true });
    this.serviceRoleKey = config.get("SUPABASE_SERVICE_ROLE_KEY", {
      infer: true,
    });
  }

  async deleteAuthUser(supabaseId: string): Promise<DeleteAuthUserResult> {
    if (!this.supabaseUrl || !this.serviceRoleKey) return "not_configured";
    const result = await deleteSupabaseAuthUser({
      supabaseUrl: this.supabaseUrl,
      serviceRoleKey: this.serviceRoleKey,
      supabaseId,
    });
    if (typeof result === "object") {
      // The opaque auth id (no email) lets an operator finish the erasure.
      this.logger.error(
        `Supabase auth user ${supabaseId} was not deleted (${result.failed}); delete it under Authentication > Users in the Supabase dashboard`,
      );
    }
    return result;
  }
}
