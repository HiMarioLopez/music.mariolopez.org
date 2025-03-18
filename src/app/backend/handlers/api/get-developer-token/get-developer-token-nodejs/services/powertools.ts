import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { Tracer } from '@aws-lambda-powertools/tracer';

export const logger = new Logger({ serviceName: 'DeveloperTokenService' });
export const tracer = new Tracer({ serviceName: 'DeveloperTokenService' });
export const secretsProvider = new SecretsProvider();
export const metrics = new Metrics({ namespace: 'DeveloperTokenService' });

export const emitTokenMetric = async (): Promise<void> => {
    metrics.addMetric('TokenGeneration', MetricUnit.Count, 1);
    await metrics.publishStoredMetrics();
}; 