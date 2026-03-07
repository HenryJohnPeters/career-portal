-- AlterTable
ALTER TABLE "InterviewQuestion" ADD COLUMN     "correctOptionIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "options" JSONB NOT NULL DEFAULT '[]';
