import { Injectable } from '@nestjs/common';
import { BackendEnvironmentConfig, DatabaseConfig } from '@gcpstarter/shared-config';
import { configuration } from './configuration';

type ConfigType = BackendEnvironmentConfig & DatabaseConfig;

@Injectable()
export class ConfigService {
  private readonly config: ConfigType;

  constructor() {
    this.config = configuration;
    console.log('ConfigService initialized with config:', {
      nodeEnv: this.nodeEnv,
      dbHost: this.get('DB_HOST'),
      dbUsername: this.get('DB_USERNAME')
    });
  }

  get<K extends keyof ConfigType>(key: K): ConfigType[K] {
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

  get entireConfig(): ConfigType {
    return { ...this.config };
  }
}
