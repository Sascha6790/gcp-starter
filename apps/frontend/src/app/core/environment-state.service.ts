import { isPlatformServer } from '@angular/common';
import {
  Inject,
  Injectable,
  makeStateKey,
  PLATFORM_ID,
  TransferState,
} from '@angular/core';
import {
  FrontendEnvironmentConfig,
  validateFrontendConfig,
} from '@gcpstarter/shared-config';

const ENV_CONFIG_KEY =
  makeStateKey<FrontendEnvironmentConfig>('environment-config');

@Injectable({
  providedIn: 'root',
})
export class EnvironmentStateService {
  private config: FrontendEnvironmentConfig;

  constructor(
    private transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    if (isPlatformServer(this.platformId)) {
      console.log('Server-side: Reading environment variables');
      console.log('BACKEND_API_URL from env:', process.env['BACKEND_API_URL']);
      console.log('NODE_ENV from env:', process.env['NODE_ENV']);

      this.config = validateFrontendConfig({
        BACKEND_API_URL: process.env['BACKEND_API_URL'],
        NODE_ENV: process.env['NODE_ENV'],
      });

      console.log('Validated config on server:', this.config);
      this.transferState.set(ENV_CONFIG_KEY, this.config);
    } else {
      console.log('Client-side: Retrieving config from TransferState');

      if (this.transferState.hasKey(ENV_CONFIG_KEY)) {
        this.config = this.transferState.get(
          ENV_CONFIG_KEY,
          {} as FrontendEnvironmentConfig
        );
        console.log('Config from TransferState:', this.config);
      } else {
        console.warn('No config in TransferState! Using fallback values.');
        this.config = validateFrontendConfig({});
      }
    }

    console.log('Final Environment Config:', this.config);
  }

  get<K extends keyof FrontendEnvironmentConfig>(key: K): FrontendEnvironmentConfig[K] {
    return this.config[key];
  }

  get backendApiUrl(): string {
    console.log('Using backendApiUrl:', this.config.BACKEND_API_URL);
    return this.config.BACKEND_API_URL;
  }

  get entireConfig(): FrontendEnvironmentConfig {
    return { ...this.config };
  }
}
