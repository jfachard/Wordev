import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('leaderboard')
export class LeaderboardController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    getLeaderboard() {
        return this.usersService.getLeaderboard();
    }
}
