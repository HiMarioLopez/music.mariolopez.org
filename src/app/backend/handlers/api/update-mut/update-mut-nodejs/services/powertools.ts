import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';

export const logger = new Logger({ serviceName: 'UpdateMUTService' });
export const tracer = new Tracer({ serviceName: 'UpdateMUTService' });
export const metrics = new Metrics({ namespace: 'UpdateMUTService' });

export const emitUpdateMetric = async (): Promise<void> => {
    metrics.addMetric('MUTUpdate', MetricUnit.Count, 1);
    await metrics.publishStoredMetrics();
}; 