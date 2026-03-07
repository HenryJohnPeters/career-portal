-- AlterTable
ALTER TABLE "InterviewQuestion" ADD COLUMN     "generatedForHash" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'seed';

-- CreateTable
CREATE TABLE "QuestionGenerationLog" (
    "id" TEXT NOT NULL,
    "filterHash" TEXT NOT NULL,
    "filterCombo" JSONB NOT NULL,
    "questionsGenerated" INTEGER NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionGenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeQuestionUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeQuestionUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionGenerationLog_filterHash_createdAt_idx" ON "QuestionGenerationLog"("filterHash", "createdAt");

-- CreateIndex
CREATE INDEX "PracticeQuestionUsage_userId_createdAt_idx" ON "PracticeQuestionUsage"("userId", "createdAt");
