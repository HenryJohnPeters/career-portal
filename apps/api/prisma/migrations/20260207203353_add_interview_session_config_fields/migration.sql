-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "companyStyle" TEXT NOT NULL DEFAULT 'startup',
ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "interviewType" TEXT NOT NULL DEFAULT 'coding',
ADD COLUMN     "roleFocus" TEXT NOT NULL DEFAULT 'fullstack';
