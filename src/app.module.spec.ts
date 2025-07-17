import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppModule Components', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  it('should have AppController defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have AppService defined', () => {
    expect(service).toBeDefined();
  });

  it('should have ConfigModule available', () => {
    expect(ConfigModule).toBeDefined();
  });
});
