const ALLOWED_WEBHOOK_HOSTS = new Set([
  'discord.com',
  'discordapp.com',
  'ptb.discord.com',
  'canary.discord.com',
]);

export function isValidDiscordWebhookUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  return (
    parsed.protocol === 'https:' &&
    ALLOWED_WEBHOOK_HOSTS.has(parsed.hostname) &&
    parsed.pathname.startsWith('/api/webhooks/')
  );
}
