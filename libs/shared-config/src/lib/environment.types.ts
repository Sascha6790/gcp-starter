export interface BaseEnvironmentConfig {
  NODE_ENV: string;
  PORT?: number;
}

export interface FrontendEnvironmentConfig extends BaseEnvironmentConfig {
  BACKEND_API_URL: string;
}

export interface BackendEnvironmentConfig extends BaseEnvironmentConfig {
  FRONTEND_URL: string;
}

export interface DatabaseConfig {
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}
