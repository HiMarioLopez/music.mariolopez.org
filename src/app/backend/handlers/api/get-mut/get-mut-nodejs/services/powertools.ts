import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';

export const logger = new Logger({ serviceName: 'GetMUTService' });
export const tracer = new Tracer({ serviceName: 'GetMUTService' });
export const metrics = new Metrics({ namespace: 'GetMUTService' });

export const emitRetrievalMetric = async (): Promise<void> => {
    metrics.addMetric('MUTRetrieval', MetricUnit.Count, 1);
    await metrics.publishStoredMetrics();
}; 