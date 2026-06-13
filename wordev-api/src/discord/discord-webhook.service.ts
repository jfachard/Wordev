import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { isValidDiscordWebhookUrl } from './discord-url.util';

const REQUEST_TIMEOUT_MS = 10_000;

@Injectable()
export class DiscordWebhookService {
  private readonly logger = new Logger(DiscordWebhookService.name);

  async postMessage(webhookUrl: string, content: string): Promise<void> {
    if (!isValidDiscordWebhookUrl(webhookUrl)) {
      throw new InternalServerErrorException('Invalid Discord webhook URL');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res: globalThis.Response;
    try {
      res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          allowed_mentions: { parse: [] },
        }),
        signal: controller.signal,
      });
    } catch (err) {
      this.logger.error(`Discord webhook request failed: ${String(err)}`);
      throw new BadRequestException('Could not deliver message to Discord');
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Discord webhook returned ${res.status}: ${body}`);
      if (res.status === 404 || res.status === 401) {
        throw new BadRequestException(
          'Discord webhook is no longer valid. Please reconnect Discord.',
        );
      }
      throw new BadRequestException('Could not deliver message to Discord');
    }
  }
}
