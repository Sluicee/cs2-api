import { Test, TestingModule } from '@nestjs/testing';
import { InspectService } from './inspect.service';

describe('InspectService', () => {
  let service: InspectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InspectService],
    }).compile();

    service = module.get<InspectService>(InspectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
