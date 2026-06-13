import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiscordWebhookCryptoService } from '../discord/discord-webhook-crypto.service';

export interface DiscordConnectionInfo {
    connected: boolean;
    guildName: string | null;
    channelName: string | null;
    connectedAt: Date | null;
}

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private discordCrypto: DiscordWebhookCryptoService,
    ) {}

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                elo: true,
                losses: true,
                wins: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    
        return user;
    }

    async getProfile(userId: string) {
        return this.findOne(userId);
    }

    async getDiscordConnection(userId: string): Promise<DiscordConnectionInfo> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                discordWebhookEnc: true,
                discordGuildName: true,
                discordChannelName: true,
                discordConnectedAt: true,
            },
        });

        if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

        return {
            connected: !!user.discordWebhookEnc,
            guildName: user.discordGuildName,
            channelName: user.discordChannelName,
            connectedAt: user.discordConnectedAt,
        };
    }

    async saveDiscordWebhook(
        userId: string,
        webhookUrl: string,
        guildName: string | null,
        channelName: string | null,
    ) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                discordWebhookEnc: this.discordCrypto.encrypt(webhookUrl),
                discordGuildName: guildName,
                discordChannelName: channelName,
                discordConnectedAt: new Date(),
            },
        });
    }

    async getDecryptedDiscordWebhook(userId: string): Promise<string | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { discordWebhookEnc: true },
        });

        if (!user?.discordWebhookEnc) return null;
        return this.discordCrypto.decrypt(user.discordWebhookEnc);
    }

    async disconnectDiscord(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                discordWebhookEnc: null,
                discordGuildName: null,
                discordChannelName: null,
                discordConnectedAt: null,
            },
        });
    }

    async getStats(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                username: true,
                elo: true,
                wins: true,
                losses: true,
                eloStats: {
                    select: { eloAfter: true, createdAt: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

        const { eloStats, ...fields } = user;
        return {
            ...fields,
            totalGames: fields.wins + fields.losses,
            eloHistory: eloStats,
        };
    }

    async getLeaderboard() {
        const users = await this.prisma.user.findMany({
            orderBy: { elo: 'desc' },
            take: 10,
            select: { username: true, elo: true, wins: true, losses: true },
        });

        return users.map((user, i) => ({ rank: i + 1, ...user }));
    }
}
