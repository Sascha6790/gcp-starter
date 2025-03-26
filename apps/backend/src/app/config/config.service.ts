import { Injectable } from '@nestjs/common';
import { BackendEnvironmentConfig } from '@gcpstarter/shared-config';
import { configuration } from './configuration';

@Injectable()
export class ConfigService {
  private readonly config: BackendEnvironmentConfig;

  constructor() {
    this.config = configuration;
  }

  get<K extends keyof BackendEnvironmentConfig>(
    key: K
  ): BackendEnvironmentConfig[K] {
    return this.config[key];
  }

  get nodeEnv(): string {
    return this.config.NODE_ENV;
  }

  get port(): number {
    return this.config.PORT || 3000;
  }

  get frontendUrl(): string {
    return this.config.FRONTEND_URL;
  }

  get isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  get entireConfig(): BackendEnvironmentConfig {
    return { ...this.config };
  }
}
