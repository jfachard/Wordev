-- AlterTable
ALTER TABLE "User" ADD COLUMN "discordWebhookEnc" TEXT,
ADD COLUMN "discordGuildName" TEXT,
ADD COLUMN "discordChannelName" TEXT,
ADD COLUMN "discordConnectedAt" TIMESTAMP(3);
