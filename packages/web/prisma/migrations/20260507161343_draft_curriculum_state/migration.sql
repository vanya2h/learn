-- AlterTable
ALTER TABLE "custom_curriculums" ADD COLUMN     "generatedPhases" JSONB,
ADD COLUMN     "outline" JSONB,
ADD COLUMN     "selections" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'published',
ADD COLUMN     "textContent" TEXT,
ALTER COLUMN "name" SET DEFAULT '',
ALTER COLUMN "phases" DROP NOT NULL;
