import * as Joi from 'joi';
import {
  BackendEnvironmentConfig,
  FrontendEnvironmentConfig,
} from './environment.types';

const baseSchema = {
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'staging', 'test', 'preview')
    .default('development')
    .description('Application runtime environment'),
};

export const frontendSchema = Joi.object<FrontendEnvironmentConfig>({
  ...baseSchema,
  PORT: Joi.number().default(4000),
  BACKEND_API_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.string().default('http://localhost:3000'),
      otherwise: Joi.string().required(),
    })
    .description('Backend API server URL'),
});

export const backendSchema = Joi.object<BackendEnvironmentConfig>({
  ...baseSchema,
  PORT: Joi.number().default(3000),
  FRONTEND_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.string().default('http://localhost:4200'),
      otherwise: Joi.string().required(),
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
  config: BackendEnvironmentConfig
): BackendEnvironmentConfig {
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
  return value;
}
