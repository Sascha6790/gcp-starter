import * as Joi from 'joi';
import {
  BaseEnvironmentConfig,
  FrontendEnvironmentConfig,
  BackendEnvironmentConfig,
  DatabaseConfig
} from './environment.types';

const baseSchema = {
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'staging', 'test', 'preview')
    .default('development')
    .description('Application runtime environment'),
  
  PORT: Joi.number()
    .default(3000)
    .description('Port number for the server'),
};

const databaseSchema = {
  DB_HOST: Joi.string()
    .when('NODE_ENV', {
      is: Joi.string().valid('production'),
      then: Joi.string().required(),
      otherwise: Joi.string().default('localhost')
    })
    .description('Database host'),
  
  DB_PORT: Joi.number()
    .default(5432)
    .description('Database port'),
  
  DB_USERNAME: Joi.string()
    .when('NODE_ENV', {
      is: Joi.string().valid('production'),
      then: Joi.string().required(),
      otherwise: Joi.string().default('dev_user')
    })
    .description('Database username'),
  
  DB_PASSWORD: Joi.string()
    .when('NODE_ENV', {
      is: Joi.string().valid('production'),
      then: Joi.string().required(),
      otherwise: Joi.string().default('dev_password')
    })
    .description('Database password'),
  
  DB_NAME: Joi.string()
    .when('NODE_ENV', {
      is: Joi.string().valid('production'),
      then: Joi.string().required(),
      otherwise: Joi.string().default('dev_db')
    })
    .description('Database name'),
};

export const frontendSchema = Joi.object<FrontendEnvironmentConfig>({
  ...baseSchema,
  PORT: Joi.number().default(4000),
  BACKEND_API_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.string().default('http://localhost:3000'),
      otherwise: Joi.string().required()
    })
    .description('Backend API server URL'),
});

export const backendSchema = Joi.object<BackendEnvironmentConfig & DatabaseConfig>({
  ...baseSchema,
  ...databaseSchema,
  FRONTEND_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.string().default('http://localhost:4200'),
      otherwise: Joi.string().required()
    })
    .description('Frontend application URL'),
});

export function validateFrontendConfig(
  config: Record<string, unknown>
): FrontendEnvironmentConfig {
  const { error, value } = frontendSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details
      .map((detail) => `Validation error: ${detail.message}`)
      .join('\n');

    console.error('Frontend configuration error:', errorMessage);
    throw new Error(
      `Invalid frontend environment configuration: ${errorMessage}`
    );
  }

  console.log('Validated frontend config:', value);
  return value as FrontendEnvironmentConfig;
}

export function validateBackendConfig(
  config: Record<string, unknown>
): BackendEnvironmentConfig & DatabaseConfig {
  const { error, value } = backendSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details
      .map((detail) => `Validation error: ${detail.message}`)
      .join('\n');

    console.error('Backend configuration error:', errorMessage);
    throw new Error(
      `Invalid backend environment configuration: ${errorMessage}`
    );
  }

  console.log('Validated backend config:', value);
  return value as BackendEnvironmentConfig & DatabaseConfig;
}

export function validateConfig(config: Record<string, unknown>): FrontendEnvironmentConfig {
  return validateFrontendConfig(config);
}
