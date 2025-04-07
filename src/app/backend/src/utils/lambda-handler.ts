import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Context } from 'aws-lambda';
import { getCorsHeaders } from './cors';
import { getRequiredEnvVar } from './env';
import { parsePaginationParams, formatPaginatedResponse } from './pagination';
import { getRequiredParameter } from './parameter-store';
import {
  ApiGatewayEvent,
  ApiGatewayResult,
  getHttpMethod,
  getOrigin,
  getPath,
} from './types';

/**
 * Options for creating Lambda utilities
 */
export interface LambdaUtilsOptions {
  serviceName: string;
  parameterStorePrefix?: string;
}

/**
 * Creates a set of utilities for a Lambda handler
 */
export function createLambdaUtils(options: LambdaUtilsOptions) {
  const { serviceName } = options;

  // Create AWS Lambda Powertools
  const logger = new Logger({ serviceName });
  const tracer = new Tracer({ serviceName });
  const metrics = new Metrics({ namespace: serviceName });

  /**
   * Tracks invocation metrics
   */
  const trackInvocation = (metricName = 'InvocationCount') => {
    metrics.addMetric(metricName, MetricUnit.Count, 1);
  };

  /**
   * Initializes the logger with request context
   */
  const initializeLogger = (context: Context) => {
    logger.appendKeys({
      requestId: context.awsRequestId,
      correlationIds: {
        awsRequestId: context.awsRequestId,
      },
    });
  };

  /**
   * Generates success response with proper CORS headers
   */
  const createSuccessResponse = (
    event: ApiGatewayEvent,
    body: Record<string, any>,
    statusCode = 200,
    additionalHeaders = {}
  ): ApiGatewayResult => {
    const method = getHttpMethod(event);
    const origin = getOrigin(event);

    return {
      statusCode,
      headers: {
        ...getCorsHeaders(origin, `${method},OPTIONS`),
        'Cache-Control': 'max-age=60',
        ...additionalHeaders,
      },
      body: JSON.stringify(body),
    };
  };

  /**
   * Generates error response with proper CORS headers
   */
  const createErrorResponse = (
    event: ApiGatewayEvent,
    error: unknown,
    statusCode = 500,
    message = 'Internal server error'
  ): ApiGatewayResult => {
    const method = getHttpMethod(event);
    const origin = getOrigin(event);

    logger.error(`Error in Lambda handler: ${message}`, { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);

    return {
      statusCode,
      headers: getCorsHeaders(origin, `${method},OPTIONS`),
      body: JSON.stringify({
        message,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  };

  return {
    logger,
    tracer,
    metrics,
    trackInvocation,
    initializeLogger,
    createSuccessResponse,
    createErrorResponse,
    // Use the imported utilities but with logger/metrics context
    getRequiredEnvVar: (name: string, fallback?: string) =>
      getRequiredEnvVar(name, { fallback, logger }),
    getRequiredParameter: (paramName: string, fallback?: string) =>
      getRequiredParameter(paramName, { fallback, logger }),
    formatPaginatedResponse,
    parseQueryParams: (event: ApiGatewayEvent, defaultLimit = 50) =>
      parsePaginationParams(event, defaultLimit),
  };
}

/**
 * Type definition for a Lambda handler
 */
export type LambdaHandler<
  TEvent extends ApiGatewayEvent,
  TResult extends ApiGatewayResult,
> = (event: TEvent, context: Context) => Promise<TResult>;

/**
 * Wraps a Lambda handler with error handling and request logging
 */
export function wrapHandler<
  TEvent extends ApiGatewayEvent,
  TResult extends ApiGatewayResult,
>(
  options: LambdaUtilsOptions,
  handler: (
    event: TEvent,
    context: Context,
    utils: ReturnType<typeof createLambdaUtils>
  ) => Promise<TResult>
): LambdaHandler<TEvent, TResult> {
  const utils = createLambdaUtils(options);

  return async (event: TEvent, context: Context): Promise<TResult> => {
    utils.initializeLogger(context);
    // Get the path from the API Gateway V2 event
    const path = getPath(event);
    utils.logger.info(`${options.serviceName} Lambda invoked`, { path });
    utils.trackInvocation();

    try {
      return await handler(event, context, utils);
    } catch (error) {
      utils.logger.error(`Unhandled error in ${options.serviceName}`, {
        error,
      });
      utils.metrics.addMetric('UnhandledErrorCount', MetricUnit.Count, 1);

      return utils.createErrorResponse(
        event,
        error,
        500,
        'An unhandled error occurred'
      ) as TResult;
    }
  };
}
