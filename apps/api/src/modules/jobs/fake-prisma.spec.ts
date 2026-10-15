/*
 * Test helper (named *.spec.ts so the API build excludes it; it defines no
 * tests). A minimal Prisma stand-in for service specs: every model method
 * resolves to what `responses["model.method"]` returns (null by default)
 * and is recorded; transactions run on the same client.
 */

export interface PrismaCall {
  model: string;
  method: string;
  args: any;
}

const MODELS = ["job", "cvVersion", "coverLetter", "user"] as const;

export function fakePrisma(responses: Record<string, (args: any) => unknown> = {}) {
  const calls: PrismaCall[] = [];
  const model = (name: string) =>
    new Proxy(
      {},
      {
        get: (_target, method: string) => async (args: any) => {
          calls.push({ model: name, method, args });
          const handler = responses[`${name}.${method}`];
          return handler ? handler(args) : null;
        },
      },
    );
  const client: any = Object.fromEntries(MODELS.map((name) => [name, model(name)]));
  client.$executeRaw = async () => 0;
  client.$transaction = async (fn: (tx: unknown) => unknown) => fn(client);
  return { client, calls };
}
