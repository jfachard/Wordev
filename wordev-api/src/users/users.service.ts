import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

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
