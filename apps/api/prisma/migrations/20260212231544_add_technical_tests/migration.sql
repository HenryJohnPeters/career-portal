-- CreateTable
CREATE TABLE "TechnicalTest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "roleFocus" TEXT NOT NULL DEFAULT 'fullstack',
    "tags" TEXT[],
    "timeLimit" INTEGER NOT NULL DEFAULT 60,
    "scenario" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "submission" TEXT,
    "evaluation" JSONB,
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicalTest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TechnicalTest" ADD CONSTRAINT "TechnicalTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
