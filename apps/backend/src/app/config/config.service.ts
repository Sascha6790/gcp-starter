import { Injectable } from '@nestjs/common';
import { EnvironmentConfig } from '@gcpstarter/shared-config';
import { configuration } from './configuration';

@Injectable()
export class ConfigService {
  private readonly config: EnvironmentConfig;

  constructor() {
    this.config = configuration;
  }

  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  get backendApiUrl(): string {
    return this.config.BACKEND_API_URL;
  }

  get nodeEnv(): string {
    return this.config.NODE_ENV;
  }

  get port(): number {
    return this.config.PORT;
  }

  get frontendUrl(): string {
    return this.config.FRONTEND_URL;
  }

  get isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  get entireConfig(): EnvironmentConfig {
    return { ...this.config };
  }
}
