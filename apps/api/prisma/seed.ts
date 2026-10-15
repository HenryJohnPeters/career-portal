import { PrismaClient } from "@prisma/client";
import { syncQuestionBank } from "../src/modules/interview-prep/question-bank/sync";

/*
 * Syncs the interview question bank (reference data, see
 * src/modules/interview-prep/question-bank) and, outside production, a few
 * dev accounts. Safe to re-run: every write is an upsert or a no-op.
 * Deploys sync the bank on their own (railway.api.json preDeployCommand).
 *
 *   pnpm db:seed                          question bank + dev users
 *   pnpm db:seed -- --no-dev-users        question bank only
 *   NODE_ENV=production pnpm db:seed      question bank only (dev users are refused)
 */

const prisma = new PrismaClient();

/** Far-future period end so dev premium accounts count as active premium. */
const DEV_PREMIUM_PERIOD_END = new Date("2099-12-31T00:00:00.000Z");

const DEV_USERS = [
  { email: "premium@careerportal.dev", name: "Premium User", premium: true },
  { email: "free@careerportal.dev", name: "Free User", premium: false },
  { email: "admin@careerportal.dev", name: "Dev Admin", premium: true },
] as const;

async function seedDevUsers(): Promise<void> {
  for (const dev of DEV_USERS) {
    const plan = dev.premium
      ? {
          isPremium: true,
          stripeCurrentPeriodEnd: DEV_PREMIUM_PERIOD_END,
          subscriptionStatus: "active",
        }
      : { isPremium: false, stripeCurrentPeriodEnd: null, subscriptionStatus: null };
    await prisma.user.upsert({
      where: { email: dev.email },
      update: plan,
      create: { email: dev.email, name: dev.name, ...plan },
    });
  }
  console.log(`Seeded dev users: ${DEV_USERS.map((u) => u.email).join(", ")}`);
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && args.has("--with-dev-users")) {
    throw new Error("Refusing to create dev users when NODE_ENV=production.");
  }

  await syncQuestionBank(prisma);

  if (isProduction) {
    console.log("NODE_ENV=production: dev users skipped.");
  } else if (args.has("--no-dev-users")) {
    console.log("--no-dev-users: dev users skipped.");
  } else {
    await seedDevUsers();
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
