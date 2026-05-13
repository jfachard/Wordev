import { Test, TestingModule } from '@nestjs/testing';
import { DailyWordService } from './daily-word.service';

describe('DailyWordService', () => {
  let service: DailyWordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DailyWordService],
    }).compile();

    service = module.get<DailyWordService>(DailyWordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
