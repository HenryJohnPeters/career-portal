-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "coverLetterId" TEXT,
ADD COLUMN     "cvVersionId" TEXT,
ADD COLUMN     "followUpDate" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_cvVersionId_fkey" FOREIGN KEY ("cvVersionId") REFERENCES "CvVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_coverLetterId_fkey" FOREIGN KEY ("coverLetterId") REFERENCES "CoverLetter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
