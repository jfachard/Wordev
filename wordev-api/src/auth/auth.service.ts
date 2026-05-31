import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) {}

    async register(registerDto: RegisterDto) {
        const { email, password, username } = registerDto;

        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            throw new ConflictException('Email or username already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                username,
                elo: 1000,
            },
        });

        return this.login(user);
    }

    async findUserByEmail(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Email not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async login(user: { id: string; email: string; username: string; tokenVersion: number }) {
        const accessToken = this.jwtService.sign(
            { userId: user.id },
            { expiresIn: '1h' },
        );
        const refreshToken = this.jwtService.sign(
            { userId: user.id, tokenVersion: user.tokenVersion, type: 'refresh' },
            { expiresIn: '7d' },
        );

        return { accessToken, refreshToken };
    }

    async verifyToken(token: string) {
        try {
            return this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
        } catch {
            throw new UnauthorizedException('Invalid token');
        }
    }

    async verifyRefreshToken(token: string) {
        try {
            const payload = this.jwtService.verify<{ userId: string; tokenVersion: number; type: string }>(token, {
                secret: process.env.JWT_SECRET,
            });
            if (payload.type !== 'refresh') {
                throw new UnauthorizedException('Invalid token type');
            }
            return payload;
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } },
        });
    }

    async findUserById(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
        });
    }

}
