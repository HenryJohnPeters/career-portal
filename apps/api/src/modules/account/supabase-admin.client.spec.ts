import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { deleteSupabaseAuthUser } from "./supabase-admin.client";

function fakeFetch(respond: () => Promise<Response> | Response) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return respond();
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

const params = {
  supabaseUrl: "https://abc.supabase.co",
  serviceRoleKey: "service-role-key",
  supabaseId: "6f1c2b9e-0000-4000-8000-000000000001",
};

describe("deleteSupabaseAuthUser", () => {
  test("calls the admin API with the service-role key and a timeout", async () => {
    const { fetchImpl, calls } = fakeFetch(() => new Response("{}", { status: 200 }));
    assert.equal(await deleteSupabaseAuthUser({ ...params, fetchImpl }), "deleted");
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      "https://abc.supabase.co/auth/v1/admin/users/6f1c2b9e-0000-4000-8000-000000000001",
    );
    assert.equal(calls[0].init.method, "DELETE");
    const headers = calls[0].init.headers as Record<string, string>;
    assert.equal(headers.apikey, "service-role-key");
    assert.equal(headers.Authorization, "Bearer service-role-key");
    assert.ok(calls[0].init.signal instanceof AbortSignal);
  });

  test("an already-deleted user (404) counts as deleted", async () => {
    const { fetchImpl } = fakeFetch(() => new Response("", { status: 404 }));
    assert.equal(await deleteSupabaseAuthUser({ ...params, fetchImpl }), "deleted");
  });

  test("errors and timeouts are reported, never thrown", async () => {
    const http = fakeFetch(() => new Response("", { status: 500 }));
    assert.deepEqual(await deleteSupabaseAuthUser({ ...params, fetchImpl: http.fetchImpl }), {
      failed: "HTTP 500",
    });
    const network = fakeFetch(() => Promise.reject(new DOMException("timed out", "TimeoutError")));
    assert.deepEqual(await deleteSupabaseAuthUser({ ...params, fetchImpl: network.fetchImpl }), {
      failed: "TimeoutError",
    });
  });

  test("the id is URL-encoded", async () => {
    const { fetchImpl, calls } = fakeFetch(() => new Response("", { status: 200 }));
    await deleteSupabaseAuthUser({ ...params, supabaseId: "../users", fetchImpl });
    assert.ok(calls[0].url.endsWith("/admin/users/..%2Fusers"));
  });
});
