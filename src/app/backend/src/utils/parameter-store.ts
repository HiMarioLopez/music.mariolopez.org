import { Logger } from '@aws-lambda-powertools/logger';
import { getParameter } from '../services/parameter';

/**
 * Utility functions for working with AWS Parameter Store
 */

/**
 * Retrieves a parameter from SSM Parameter Store
 * Throws an error if the parameter is not found and no fallback is provided
 */
export async function getRequiredParameter(
  paramName: string,
  options: {
    fallback?: string;
    logger?: Logger;
  } = {}
): Promise<string> {
  const { fallback, logger } = options;

  try {
    const param = await getParameter(paramName);
    if (!param) {
      if (fallback) {
        logger?.warn(
          `Failed to retrieve parameter: ${paramName}, using fallback value`
        );
        return fallback;
      }
      throw new Error(`Failed to retrieve parameter: ${paramName}`);
    }
    return param;
  } catch (error) {
    if (fallback) {
      logger?.warn(
        `Error retrieving parameter: ${paramName}, using fallback value`,
        { error }
      );
      return fallback;
    }
    throw error;
  }
}

/**
 * Retrieves multiple parameters from SSM Parameter Store with optional fallbacks
 */
export async function getRequiredParameters(
  paramNames: string[],
  options: {
    fallbacks?: Record<string, string>;
    logger?: Logger;
  } = {}
): Promise<Record<string, string>> {
  const { fallbacks = {}, logger } = options;
  const results: Record<string, string> = {};

  await Promise.all(
    paramNames.map(async (paramName) => {
      try {
        results[paramName] = await getRequiredParameter(paramName, {
          fallback: fallbacks[paramName],
          logger,
        });
      } catch (error) {
        logger?.error(`Failed to retrieve parameter: ${paramName}`, { error });
        throw error;
      }
    })
  );

  return results;
}

/**
 * Gets parameters with a common prefix
 */
export async function getParametersByPrefix(
  prefix: string,
  options: {
    logger?: Logger;
  } = {}
): Promise<Record<string, string>> {
  const { logger } = options;

  try {
    // This would need to be implemented in the parameter service
    // Just a placeholder for now that would be implemented later
    throw new Error('Not implemented yet');
  } catch (error) {
    logger?.error(`Failed to retrieve parameters with prefix: ${prefix}`, {
      error,
    });
    throw error;
  }
}
