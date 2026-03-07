-- AlterTable
ALTER TABLE "CvSection" ADD COLUMN     "sectionType" TEXT NOT NULL DEFAULT 'custom';

-- AlterTable
ALTER TABLE "CvVersion" ADD COLUMN     "github" TEXT,
ADD COLUMN     "headerLayout" TEXT NOT NULL DEFAULT 'split',
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "templateId" TEXT NOT NULL DEFAULT 'classic',
ADD COLUMN     "themeConfig" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "website" TEXT;
