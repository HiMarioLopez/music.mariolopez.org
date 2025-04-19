import {
  CloudFrontRequestEvent,
  CloudFrontRequestResult,
  Context,
  CloudFrontRequest,
} from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const logger = new Logger({ serviceName: 'music-frontend-randomization' });
const tracer = new Tracer({ serviceName: 'music-frontend-randomization' });
const metrics = new Metrics({ namespace: 'music-frontend-randomization' });

const siteVersions = [
  '/react',
  // '/vanilla',    // Under construction
  // '/lit',        // Under construction
  // '/qwik',       // Under construction
  // '/solid',      // Under construction
  // '/svelte',     // Under construction
  // '/vue',        // Under construction
  // '/preact',     // Under construction
  // '/next',       // Under construction
  // '/angular',    // Under construction
];

export const handler = (
  event: CloudFrontRequestEvent,
  context: Context,
  callback: (err: Error | null, result: CloudFrontRequestResult) => void
): void => {
  try {
    logger.info('Event received', { event });
    metrics.addMetric('InvocationCount', MetricUnit.Count, 1);

    const request: CloudFrontRequest = event.Records[0].cf.request;
    const uri = request.uri; // Use a shorter variable name

    // 1. Handle Root Request: Randomize
    if (uri === '/') {
      const randomIndex = Math.floor(Math.random() * siteVersions.length);
      const selectedVersionPath = siteVersions[randomIndex];
      logger.info('Applying route randomization for root', {
        originalUri: uri,
        selectedVersion: selectedVersionPath,
      });
      // Correctly append /index.html for root randomization
      request.uri = `${selectedVersionPath}/index.html`;
      metrics.addMetric('RouteRandomized', MetricUnit.Count, 1);
      callback(null, request);
      return; // Exit early
    }

    // 2. Check if URI starts with a known version prefix
    // Use find to get the specific version matched
    const matchedVersion = siteVersions.find(
      (version) => uri.startsWith(version + '/') || uri === version
    );

    if (matchedVersion) {
      // URI starts with a known version (e.g., /react/ or /react/foo.js or /react)
      logger.info('Request matches known site version', {
        uri: uri,
        matchedVersion: matchedVersion,
      });

      // Check if it's a request *for* the directory index itself
      if (uri === matchedVersion || uri === `${matchedVersion}/`) {
        logger.info('Request is for version root, rewriting to index.html', {
          originalUri: uri,
        });
        // Rewrite to serve index.html from that version's prefix
        request.uri = `${matchedVersion}/index.html`;
        metrics.addMetric('VersionIndexRewrite', MetricUnit.Count, 1);
      } else {
        // Request is for a specific file within the version (e.g., /react/app.js)
        // Leave the URI as is.
        logger.info(
          'Request is for specific file within version, URI unchanged',
          { uri: uri }
        );
        // request.uri remains unchanged
        metrics.addMetric('VersionFileRequest', MetricUnit.Count, 1);
      }
    } else {
      // 3. Handle Unknown Paths (Optional)
      logger.warn('Request URI does not match known versions and is not root', {
        uri: uri,
      });
      metrics.addMetric('UnknownPathRequest', MetricUnit.Count, 1);
      // request.uri remains unchanged - CloudFront/S3 will likely 404/403
    }

    // Invoke the callback function with the potentially modified request
    callback(null, request);
  } catch (error) {
    logger.error('Error in Lambda handler', error as Error);
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);
    // Return original request on error to prevent total failure
    callback(error as Error, event.Records[0].cf.request);
  }
};
