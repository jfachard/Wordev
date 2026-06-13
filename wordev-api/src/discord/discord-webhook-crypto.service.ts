import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class DiscordWebhookCryptoService {
  private getKey(): Buffer {
    const raw = process.env.DISCORD_WEBHOOK_ENCRYPTION_KEY;
    if (!raw) {
      throw new InternalServerErrorException(
        'DISCORD_WEBHOOK_ENCRYPTION_KEY is not configured',
      );
    }

    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      throw new InternalServerErrorException(
        'DISCORD_WEBHOOK_ENCRYPTION_KEY must be 32 bytes (base64-encoded)',
      );
    }

    return key;
  }

  encrypt(plaintext: string): string {
    const key = this.getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decrypt(ciphertext: string): string {
    const key = this.getKey();
    const data = Buffer.from(ciphertext, 'base64');

    if (data.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      throw new InternalServerErrorException('Invalid encrypted webhook payload');
    }

    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }
}
