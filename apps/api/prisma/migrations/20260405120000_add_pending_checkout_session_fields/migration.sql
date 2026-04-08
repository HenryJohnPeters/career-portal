-- Add durable pending checkout fields used to prevent duplicate Stripe checkout sessions.
ALTER TABLE "User"
ADD COLUMN "stripeCheckoutSessionId" TEXT,
ADD COLUMN "stripeCheckoutSessionExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_stripeCheckoutSessionId_key"
ON "User"("stripeCheckoutSessionId");
