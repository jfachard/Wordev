import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WordService } from '../word/word.service';

@Injectable()
export class GamesService {
    constructor(private prisma: PrismaService, private wordService: WordService) {}
}
