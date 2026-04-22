/*
  Warnings:

  - You are about to drop the column `word` on the `DailyWord` table. All the data in the column will be lost.
  - Added the required column `wordId` to the `DailyWord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DailyWord" DROP COLUMN "word",
ADD COLUMN     "wordId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "DailyWord" ADD CONSTRAINT "DailyWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
