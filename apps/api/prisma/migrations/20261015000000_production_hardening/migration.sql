-- DropForeignKey
ALTER TABLE "CvVersion" DROP CONSTRAINT "CvVersion_userId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionAnswer" DROP CONSTRAINT "QuestionAnswer_userId_fkey";

-- DropForeignKey
ALTER TABLE "CoverLetter" DROP CONSTRAINT "CoverLetter_userId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_userId_fkey";

-- DropForeignKey
ALTER TABLE "InterviewSession" DROP CONSTRAINT "InterviewSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "TechnicalTest" DROP CONSTRAINT "TechnicalTest_userId_fkey";

-- DropForeignKey
ALTER TABLE "AiUsage" DROP CONSTRAINT "AiUsage_userId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingDismissedAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" TEXT,
ADD COLUMN     "trialEnd" TIMESTAMP(3),
ADD COLUMN     "trialUsedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CvVersion" ADD COLUMN     "lastSnapshot" JSONB;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "appliedAt" TIMESTAMP(3),
ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "keySkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "location" TEXT,
ADD COLUMN     "matchCheckedAt" TIMESTAMP(3),
ADD COLUMN     "matchScore" INTEGER,
ADD COLUMN     "salary" TEXT;

-- AlterTable
ALTER TABLE "TechnicalTest" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AiUsage" ADD COLUMN     "completionTokens" INTEGER,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "promptTokens" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'succeeded';

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "CvVersion_userId_updatedAt_idx" ON "CvVersion"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "CvSection_cvVersionId_order_idx" ON "CvSection"("cvVersionId", "order");

-- CreateIndex
CREATE INDEX "CoverLetter_userId_updatedAt_idx" ON "CoverLetter"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "CoverLetter_jobId_idx" ON "CoverLetter"("jobId");

-- CreateIndex
CREATE INDEX "Job_userId_status_idx" ON "Job"("userId", "status");

-- CreateIndex
CREATE INDEX "Job_userId_followUpDate_idx" ON "Job"("userId", "followUpDate");

-- CreateIndex
CREATE INDEX "Job_userId_updatedAt_idx" ON "Job"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Job_cvVersionId_idx" ON "Job"("cvVersionId");

-- CreateIndex
CREATE INDEX "Job_coverLetterId_idx" ON "Job"("coverLetterId");

-- CreateIndex
CREATE INDEX "InterviewQuestion_track_level_difficulty_idx" ON "InterviewQuestion"("track", "level", "difficulty");

-- CreateIndex
CREATE INDEX "InterviewSession_userId_createdAt_idx" ON "InterviewSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InterviewSessionQuestion_sessionId_orderIndex_idx" ON "InterviewSessionQuestion"("sessionId", "orderIndex");

-- CreateIndex
CREATE INDEX "InterviewSessionQuestion_questionId_idx" ON "InterviewSessionQuestion"("questionId");

-- CreateIndex
CREATE INDEX "TechnicalTest_userId_createdAt_idx" ON "TechnicalTest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "QuestionGenerationLog_triggeredBy_createdAt_idx" ON "QuestionGenerationLog"("triggeredBy", "createdAt");

-- AddForeignKey
ALTER TABLE "CvVersion" ADD CONSTRAINT "CvVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAnswer" ADD CONSTRAINT "QuestionAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalTest" ADD CONSTRAINT "TechnicalTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: jobs past the wishlist stage were applied to at (or before) creation.
-- "saved" is the legacy name for "wishlist".
UPDATE "Job" SET "appliedAt" = "createdAt" WHERE "appliedAt" IS NULL AND status NOT IN ('wishlist', 'saved');
