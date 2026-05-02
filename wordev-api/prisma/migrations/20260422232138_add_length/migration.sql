/*
  Warnings:

  - The primary key for the `DailyWord` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `length` to the `Word` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DailyWord" DROP CONSTRAINT "DailyWord_pkey",
ALTER COLUMN "date" SET DATA TYPE DATE,
ADD CONSTRAINT "DailyWord_pkey" PRIMARY KEY ("date");

-- AlterTable
ALTER TABLE "Word" ADD COLUMN "length" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
UPDATE "Word" SET "length" = LENGTH("word");

ALTER TABLE "Word" ALTER COLUMN "length" DROP DEFAULT;
