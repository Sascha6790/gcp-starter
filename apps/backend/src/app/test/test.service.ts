import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable()
export class TestService {
  constructor(private configService: ConfigService) {}

  getTestMessage() {
    return {
      message: 'Backend test endpoint working successfully!',
      timestamp: new Date().toISOString(),
      environment: {
        production: this.configService.isProduction,
        frontendUrl: this.configService.frontendUrl,
        config: this.configService.entireConfig
      }
    };
  }
}
