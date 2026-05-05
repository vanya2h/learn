/*
  Warnings:

  - You are about to drop the `specializations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "specializations" DROP CONSTRAINT "specializations_userId_fkey";

-- DropTable
DROP TABLE "specializations";

-- CreateTable
CREATE TABLE "topic_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "phaseData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_curriculums" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "jobUrl" TEXT,
    "coverImage" TEXT,
    "phases" JSONB NOT NULL,
    "skills" JSONB,
    "complexity" TEXT NOT NULL DEFAULT 'deep',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_curriculums_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topic_sessions_userId_taskId_key" ON "topic_sessions"("userId", "taskId");

-- AddForeignKey
ALTER TABLE "topic_sessions" ADD CONSTRAINT "topic_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_curriculums" ADD CONSTRAINT "custom_curriculums_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
