import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @UseGuards(ThrottlerGuard)
    @Post('register')
    async register(
        @Body() registerDto: RegisterDto
    ) {
        return this.authService.register(registerDto);
    }

    @UseGuards(ThrottlerGuard)
    @Post('login')
    async login(
        @Body() loginDto: LoginDto
    ) {
        const user = await this.authService.findUserByEmail(loginDto.email, loginDto.password);
        return this.authService.login(user);
    }

    @Post('refresh')
    async refresh(
        @Body('refreshToken') token: string
    ) {
        const payload = await this.authService.verifyRefreshToken(token);
        const user = await this.authService.findUserById(payload.userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        if (user.tokenVersion !== payload.tokenVersion) {
            throw new UnauthorizedException('Refresh token has been revoked');
        }
        return this.authService.login(user);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@Req() req: any) {
        await this.authService.logout(req.user.userId);
    }
}
