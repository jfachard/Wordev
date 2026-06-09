import { Body, Controller, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Response, Request } from 'express';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @UseGuards(ThrottlerGuard)
    @Post('register')
    async register(
        @Body() registerDto: RegisterDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const tokens = await this.authService.register(registerDto);
        res.cookie(REFRESH_COOKIE, tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
        return { accessToken: tokens.accessToken };
    }

    @UseGuards(ThrottlerGuard)
    @Post('login')
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const user = await this.authService.findUserByEmail(loginDto.email, loginDto.password);
        const tokens = await this.authService.login(user);
        res.cookie(REFRESH_COOKIE, tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
        return { accessToken: tokens.accessToken };
    }

    @Post('refresh')
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const token = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
        if (!token) throw new UnauthorizedException('No refresh token');

        const payload = await this.authService.verifyRefreshToken(token);
        const user = await this.authService.findUserById(payload.userId);

        if (!user) throw new UnauthorizedException('User not found');
        if (user.tokenVersion !== payload.tokenVersion) {
            throw new UnauthorizedException('Refresh token has been revoked');
        }

        const tokens = await this.authService.login(user);
        res.cookie(REFRESH_COOKIE, tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
        return { accessToken: tokens.accessToken };
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(
        @Req() req: any,
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.authService.logout(req.user.userId);
        res.clearCookie(REFRESH_COOKIE, { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined });
    }
}
