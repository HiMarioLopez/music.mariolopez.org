import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';

export const logger = new Logger({ serviceName: 'StoreMUTService' });
export const tracer = new Tracer({ serviceName: 'StoreMUTService' });
export const metrics = new Metrics({ namespace: 'StoreMUTService' });

export const emitStorageMetric = async (): Promise<void> => {
    metrics.addMetric('MUTStorage', MetricUnit.Count, 1);
    await metrics.publishStoredMetrics();
}; 