import { Controller, Delete, Get, Param, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req: any) {
        return this.usersService.getProfile(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/discord')
    getDiscordConnection(@Request() req: any) {
        return this.usersService.getDiscordConnection(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me/discord')
    disconnectDiscord(@Request() req: any) {
        return this.usersService.disconnectDiscord(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/stats')
    getStats(@Param('id') id: string) {
        return this.usersService.getStats(id);
    }
}
