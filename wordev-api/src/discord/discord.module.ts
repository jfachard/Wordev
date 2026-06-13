import { Module } from '@nestjs/common';
import { DiscordWebhookCryptoService } from './discord-webhook-crypto.service';
import { DiscordWebhookService } from './discord-webhook.service';

@Module({
  providers: [DiscordWebhookCryptoService, DiscordWebhookService],
  exports: [DiscordWebhookCryptoService, DiscordWebhookService],
})
export class DiscordModule {}
