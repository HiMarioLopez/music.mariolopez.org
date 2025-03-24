import { CloudFrontRequestEvent, CloudFrontRequestResult, Context, CloudFrontRequest } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const logger = new Logger({ serviceName: 'music-frontend-randomization' });
const tracer = new Tracer({ serviceName: 'music-frontend-randomization' });
const metrics = new Metrics({ namespace: 'music-frontend-randomization' });

/**
 * An array of site versions used for route randomization.
 * Each version corresponds to a specific framework or library.
 * @type {string[]}
 */
const siteVersions = [
    '/react',
    // '/vanilla', // Under construction
    // '/lit', // Under construction
    // '/qwik', // Under construction
    // '/solid', // Under construction
    // '/svelte', // Under construction
    // '/vue', // Under construction
    // '/preact', // Under construction
    // '/next',
    // '/angular',
    // '/blazor',
    // '/leptos'
];

/**
 * LambdaEdge handler function for route randomization.
 *
 * This function inspects the incoming request URI and checks if the first path segment
 * matches any of the defined site versions. If there is a match, the request URI remains
 * unchanged. If there is no match, a random site version is selected and prepended to
 * the request URI.
 */
export const handler = (event: CloudFrontRequestEvent, context: Context, callback: (err: Error | null, result: CloudFrontRequestResult) => void): void => {
    try {
        logger.info('Event received', { event });
        metrics.addMetric('InvocationCount', MetricUnit.Count, 1);

        const request: CloudFrontRequest = event.Records[0].cf.request;
        
        // Extract the first path segment from the request URI
        const firstPathSegment = `/${request.uri.split('/')[1] || ''}`;

        // Check if the first path segment matches any of the defined site versions
        // If there is no match, select a random site version and prepend it to the request URI
        if (!siteVersions.includes(firstPathSegment)) {
            const randomIndex = Math.floor(Math.random() * siteVersions.length);
            logger.info('Applying route randomization', { 
                originalUri: request.uri,
                selectedVersion: siteVersions[randomIndex]
            });
            request.uri = siteVersions[randomIndex] + request.uri;
            metrics.addMetric('RouteRandomized', MetricUnit.Count, 1);
        } else {
            logger.info('No route randomization needed', { uri: request.uri });
        }

        // Invoke the callback function with the modified request
        callback(null, request);
    } catch (error) {
        logger.error('Error in Lambda handler', error as Error);
        metrics.addMetric('ErrorCount', MetricUnit.Count, 1);
        callback(error as Error, event.Records[0].cf.request);
    }
};
