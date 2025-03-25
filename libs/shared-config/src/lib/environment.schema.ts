import * as Joi from 'joi';
import { EnvironmentConfig } from './environment.types';

export const environmentSchema = Joi.object<EnvironmentConfig>({
  BACKEND_API_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:3000')
    .description('Backend API server URL'),
  
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'staging', 'test')
    .default('development')
    .description('Application runtime environment'),
    
  PORT: Joi.number()
    .default(3000)
    .description('Port number for the server'),
    
  FRONTEND_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:4200')
    .description('Frontend application URL'),
});

export function validateConfig(config: Record<string, unknown>): EnvironmentConfig {
  const { error, value } = environmentSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details
      .map((detail) => `Validation error: ${detail.message}`)
      .join('\n');
    
    console.error('Configuration error:', errorMessage);
    throw new Error(`Invalid environment configuration: ${errorMessage}`);
  }

  return value as EnvironmentConfig;
}
