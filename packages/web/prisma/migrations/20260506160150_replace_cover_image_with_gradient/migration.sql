-- AlterTable
ALTER TABLE "custom_curriculums" DROP COLUMN "coverImage",
ADD COLUMN     "cover" JSONB;
