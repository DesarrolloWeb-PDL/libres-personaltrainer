-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN "slug" TEXT,
ADD COLUMN "gifUrl" TEXT,
ADD COLUMN "bodyPart" TEXT,
ADD COLUMN "category" TEXT,
ADD COLUMN "muscle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");