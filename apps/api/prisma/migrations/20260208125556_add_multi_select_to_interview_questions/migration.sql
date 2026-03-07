-- AlterTable
ALTER TABLE "InterviewQuestion" ADD COLUMN     "correctOptionIndices" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "multiSelect" BOOLEAN NOT NULL DEFAULT false;
