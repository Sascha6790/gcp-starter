import { Injectable } from '@nestjs/common';
import { environment } from '../config/environment';

@Injectable()
export class TestService {
  getTestMessage() {
    return {
      message: 'Backend test endpoint working successfully!',
      timestamp: new Date().toISOString(),
      environment: {
        production: environment.production,
        frontendUrl: environment.frontendUrl,
      }
    };
  }
}
