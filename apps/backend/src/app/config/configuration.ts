import { EnvironmentConfig, validateConfig } from '@gcpstarter/shared-config';

export function loadConfiguration(): EnvironmentConfig {
  return validateConfig({
    BACKEND_API_URL: process.env.BACKEND_API_URL,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    FRONTEND_URL: process.env.FRONTEND_URL,
  });
}

export const configuration = loadConfiguration();
