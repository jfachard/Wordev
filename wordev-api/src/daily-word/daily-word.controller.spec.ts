import { Test, TestingModule } from '@nestjs/testing';
import { DailyWordController } from './daily-word.controller';

describe('DailyWordController', () => {
  let controller: DailyWordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyWordController],
    }).compile();

    controller = module.get<DailyWordController>(DailyWordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
