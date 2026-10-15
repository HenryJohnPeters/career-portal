import { PrismaClient } from "@prisma/client";
import { syncQuestionBank } from "../modules/interview-prep/question-bank/sync";

/*
 * Syncs the reference interview question bank into the database at
 * DATABASE_URL, then exits (non-zero on any failure). Railway runs it after
 * `prisma migrate deploy` in the API's preDeployCommand (railway.api.json),
 * so a deploy never goes live without its questions.
 *
 *   node dist/apps/api/scripts/sync-question-bank.js     built image / after `pnpm build:api`
 *
 * Idempotent: a second run reports every question unchanged.
 */
async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const prisma = new PrismaClient({ errorFormat: "minimal" });
  try {
    await syncQuestionBank(prisma, (line) => console.log(line));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`Question bank sync failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
