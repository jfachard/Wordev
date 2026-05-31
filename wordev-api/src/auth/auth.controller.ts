import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    async register(
        @Body() registerDto: RegisterDto
    ) {
        return this.authService.register(registerDto);
    }

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
        const payload = await this.authService.verifyToken(token);
        const user = await this.authService.findUserById(payload.userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return this.authService.login(user);
    }
}
