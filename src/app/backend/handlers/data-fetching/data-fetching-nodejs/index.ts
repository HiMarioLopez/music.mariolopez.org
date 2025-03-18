import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { appleMusicService } from './services/apple-music';
import { cacheService, createCacheKey } from './services/cache';
import { notificationService } from './services/notification';
import { emitCacheMetric, logger, metrics, tracer } from './services/powertools';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const requestKey = createCacheKey(event, {
            stripPrefix: '/api/nodejs',
            includeMethod: true,
            includeQuery: true
        });

        const developerToken = event.headers['Authorization']?.replace('Bearer ', '');
        if (!developerToken) {
            return {
                statusCode: 401,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Unauthorized', message: 'Developer token is required' })
            };
        }

        // Check L1 cache
        const cachedData = cacheService.getFromMemory(requestKey);
        if (cachedData) {
            logger.info('L1 cache hit');
            await emitCacheMetric('l1-cache');
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'max-age=60',
                },
                body: JSON.stringify({ data: cachedData.data, source: 'l1-cache' })
            };
        }

        // Check L2 cache
        const redisData = await cacheService.getFromRedis(requestKey);
        if (redisData) {
            logger.info('L2 cache hit');
            await emitCacheMetric('l2-cache');
            cacheService.setInMemory(requestKey, redisData);
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'max-age=60',
                },
                body: JSON.stringify({ data: redisData, source: 'l2-cache' })
            };
        }

        // Cache miss - fetch from API
        await emitCacheMetric('api');
        const musicUserToken = await appleMusicService.getMusicUserToken();
        const apiData = await appleMusicService.fetchFromApi(event.path, developerToken, musicUserToken);

        // Store in both caches
        cacheService.setInMemory(requestKey, apiData);
        await cacheService.setInRedis(requestKey, apiData);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'max-age=60',
            },
            body: JSON.stringify({ data: apiData, source: 'api' })
        };

    } catch (error: any) {
        logger.error('Error processing request', { error });

        if (appleMusicService.isTokenExpirationError(error)) {
            logger.info('Token expiration detected, triggering refresh notification');
            await notificationService.sendTokenRefreshNotification();
            await notificationService.queueFailedRequest(event);

            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'One or more authentication tokens have expired. An admin has been notified to refresh them.',
                    message: 'Please try again in a few minutes.'
                })
            };
        }

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

export const handler = middy(baseHandler)
    .use(captureLambdaHandler(tracer))
    .use(logMetrics(metrics));
