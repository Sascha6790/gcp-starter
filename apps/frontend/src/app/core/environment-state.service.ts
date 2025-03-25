import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, Inject, makeStateKey, TransferState } from '@angular/core';
import { EnvironmentConfig, validateConfig } from '@gcpstarter/shared-config';

const ENV_CONFIG_KEY = makeStateKey<EnvironmentConfig>('environment-config');

@Injectable({
  providedIn: 'root'
})
export class EnvironmentStateService {
  private config: EnvironmentConfig;

  constructor(
    private transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    if (isPlatformServer(this.platformId)) {
      this.config = validateConfig({
        BACKEND_API_URL: process.env['BACKEND_API_URL'],
        NODE_ENV: process.env['NODE_ENV'],
      });

      this.transferState.set(ENV_CONFIG_KEY, this.config);
    }
    else {
      if (this.transferState.hasKey(ENV_CONFIG_KEY)) {
        this.config = this.transferState.get(ENV_CONFIG_KEY, {} as EnvironmentConfig);
      } else {
        this.config = validateConfig({});
      }
    }

    console.log('Environment Config:', this.config);
  }

  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  get backendApiUrl(): string {
    return this.config.BACKEND_API_URL;
  }

  get entireConfig(): EnvironmentConfig {
    return { ...this.config };
  }
}
