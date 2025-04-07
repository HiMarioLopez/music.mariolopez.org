import { Logger } from '@aws-lambda-powertools/logger';

/**
 * Utility functions for working with environment variables
 */

/**
 * Retrieves a required environment variable
 * Throws an error if the variable is not set and no fallback is provided
 */
export function getRequiredEnvVar(
  name: string,
  options: {
    fallback?: string;
    logger?: Logger;
  } = {}
): string {
  const { fallback, logger } = options;

  const value = process.env[name];
  if (!value) {
    if (fallback !== undefined) {
      logger?.warn(
        `Missing environment variable: ${name}, using fallback value`
      );
      return fallback;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Retrieves multiple required environment variables
 * Throws an error if any variable is not set and no fallback is provided
 */
export function getRequiredEnvVars(
  names: string[],
  options: {
    fallbacks?: Record<string, string>;
    logger?: Logger;
  } = {}
): Record<string, string> {
  const { fallbacks = {}, logger } = options;

  return names.reduce<Record<string, string>>((result, name) => {
    result[name] = getRequiredEnvVar(name, {
      fallback: fallbacks[name],
      logger,
    });
    return result;
  }, {});
}

/**
 * Gets a boolean environment variable
 */
export function getBooleanEnvVar(
  name: string,
  options: {
    defaultValue?: boolean;
    logger?: Logger;
  } = {}
): boolean {
  const { defaultValue = false, logger } = options;

  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/**
 * Gets a numeric environment variable
 */
export function getNumericEnvVar(
  name: string,
  options: {
    defaultValue?: number;
    logger?: Logger;
  } = {}
): number {
  const { defaultValue, logger } = options;

  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required numeric environment variable: ${name}`);
  }

  const parsed = Number(value);
  if (isNaN(parsed)) {
    if (defaultValue !== undefined) {
      logger?.warn(
        `Invalid numeric environment variable: ${name}='${value}', using default value`,
        { defaultValue }
      );
      return defaultValue;
    }
    throw new Error(`Invalid numeric environment variable: ${name}='${value}'`);
  }

  return parsed;
}
