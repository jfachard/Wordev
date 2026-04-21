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
        const user = await this.authService.findUserByEmail(loginDto.email, loginDto.passwordHash);
        if(user instanceof UnauthorizedException){
            throw user;
        }

        return this.authService.login(user);
    }

    @Post('refresh')
    async refresh(
        @Body('refreshToken') token: string
    ) {
        const payload = await this.authService.verifyToken(token);
        if (payload instanceof UnauthorizedException) {
            throw payload;
        }
        const user = await this.authService.findUserById(payload.sub);

        if(user instanceof UnauthorizedException){
            throw user;
        }

        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return this.authService.login(user);
    }
}
