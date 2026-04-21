import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';


@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) {}

    async register(registerDto: RegisterDto) {
        const { email, passwordHash, username } = registerDto;
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(passwordHash, 10);

        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                username,
            },
        });
        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async findUserByEmail(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return new UnauthorizedException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async login(user: { id: string; email: string }) {
        const payload = { 
            sub: user.id,
            email: user.email 
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '1h',
        });

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    async verifyToken(token: string) {
        try {
            return this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET,
            });
        } catch (e) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    async findUserById(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
        });
    }

}
