import { BackendEnvironmentConfig, validateBackendConfig } from '@gcpstarter/shared-config';

export function loadConfiguration(): BackendEnvironmentConfig {
  return validateBackendConfig({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    FRONTEND_URL: process.env.FRONTEND_URL,
  });
}

export const configuration = loadConfiguration();