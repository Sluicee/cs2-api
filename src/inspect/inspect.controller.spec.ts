import { Test, TestingModule } from '@nestjs/testing';
import { InspectController } from './inspect.controller';

describe('InspectController', () => {
  let controller: InspectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectController],
    }).compile();

    controller = module.get<InspectController>(InspectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
