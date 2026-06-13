import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { isValidDiscordWebhookUrl } from '../discord/discord-url.util';

const DISCORD_API = 'https://discord.com/api/v10';
const STATE_PURPOSE = 'discord_oauth';
const REQUEST_TIMEOUT_MS = 10_000;
const STATE_TTL_MS = 10 * 60 * 1000;

function fetchWithTimeout(
  url: string,
  init?: RequestInit,
): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );
}

interface DiscordTokenResponse {
  access_token: string;
  webhook: {
    name: string;
    url: string;
    channel_id: string;
    guild_id: string;
  };
}

@Injectable()
export class DiscordOAuthService {
  /** OAuth state jtis already consumed (single-use CSRF tokens). */
  private readonly usedStateJtis = new Map<string, number>();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  private pruneUsedStateJtis(): void {
    const now = Date.now();
    for (const [jti, exp] of this.usedStateJtis) {
      if (exp <= now) this.usedStateJtis.delete(jti);
    }
  }

  private markStateJtiUsed(jti: string): void {
    this.pruneUsedStateJtis();
    this.usedStateJtis.set(jti, Date.now() + STATE_TTL_MS);
  }

  private get clientId(): string {
    const id = process.env.DISCORD_CLIENT_ID;
    if (!id) throw new Error('DISCORD_CLIENT_ID is not configured');
    return id;
  }

  private get clientSecret(): string {
    const secret = process.env.DISCORD_CLIENT_SECRET;
    if (!secret) throw new Error('DISCORD_CLIENT_SECRET is not configured');
    return secret;
  }

  private get redirectUri(): string {
    const uri = process.env.DISCORD_REDIRECT_URI;
    if (!uri) throw new Error('DISCORD_REDIRECT_URI is not configured');
    return uri;
  }

  get frontendOrigin(): string {
    return process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  }

  startOAuth(userId: string): string {
    return this.buildAuthorizeUrl(userId);
  }

  buildAuthorizeUrl(userId: string): string {
    const jti = randomUUID();
    const state = this.jwtService.sign(
      { userId, purpose: STATE_PURPOSE, jti },
      { expiresIn: '10m' },
    );
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'webhook.incoming',
      state,
    });
    return `https://discord.com/api/oauth2/authorize?${params}`;
  }

  buildFrontendRedirect(query: Record<string, string>): string {
    const qs = new URLSearchParams(query).toString();
    return `${this.frontendOrigin}/settings?${qs}`;
  }

  private verifyState(state: string): string {
    try {
      const payload = this.jwtService.verify<{
        userId: string;
        purpose: string;
        jti: string;
      }>(state);
      if (payload.purpose !== STATE_PURPOSE) {
        throw new BadRequestException('Invalid OAuth state');
      }
      if (!payload.jti) {
        throw new BadRequestException('Invalid OAuth state');
      }
      if (this.usedStateJtis.has(payload.jti)) {
        throw new BadRequestException('OAuth state already used');
      }
      this.markStateJtiUsed(payload.jti);
      return payload.userId;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Invalid or expired OAuth state');
    }
  }

  async handleCallback(code: string, state: string): Promise<string> {
    const userId = this.verifyState(state);
    const tokenData = await this.exchangeCode(code);
    const { guildName, channelName } = await this.resolveNames(
      tokenData.access_token,
      tokenData.webhook,
    );

    await this.usersService.saveDiscordWebhook(
      userId,
      tokenData.webhook.url,
      guildName,
      channelName,
    );

    return this.buildFrontendRedirect({ discord: 'connected' });
  }

  private async exchangeCode(code: string): Promise<DiscordTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
    });

    const res = await fetchWithTimeout(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      throw new BadRequestException('Discord token exchange failed');
    }

    const data = (await res.json()) as DiscordTokenResponse;
    if (!data.webhook?.url || !isValidDiscordWebhookUrl(data.webhook.url)) {
      throw new BadRequestException('Discord did not return a valid webhook');
    }

    return data;
  }

  private async resolveNames(
    accessToken: string,
    webhook: DiscordTokenResponse['webhook'],
  ): Promise<{ guildName: string | null; channelName: string | null }> {
    let channelName: string | null = webhook.name;
    let guildName: string | null = null;

    try {
      const chRes = await fetchWithTimeout(
        `${DISCORD_API}/channels/${webhook.channel_id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (chRes.ok) {
        const ch = (await chRes.json()) as { name: string };
        channelName = ch.name;
      }
    } catch {
      // best effort
    }

    if (webhook.guild_id) {
      try {
        const gRes = await fetchWithTimeout(
          `${DISCORD_API}/guilds/${webhook.guild_id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (gRes.ok) {
          const g = (await gRes.json()) as { name: string };
          guildName = g.name;
        }
      } catch {
        // best effort — guilds scope not granted
      }
    }

    return { guildName, channelName };
  }
}
