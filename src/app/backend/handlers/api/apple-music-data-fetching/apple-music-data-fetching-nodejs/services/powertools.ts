import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';

export const metrics = new Metrics({
    namespace: 'AppleMusicAPI',
    serviceName: 'AppleMusicDataFetching'
});
export const logger = new Logger({ serviceName: 'AppleMusicDataFetching' });
export const tracer = new Tracer({ serviceName: 'AppleMusicDataFetching' });
export const parameters = new SSMProvider();

export const emitCacheMetric = async (source: 'l1-cache' | 'l2-cache' | 'api'): Promise<void> => {
    metrics.addDimension('Source', source);
    metrics.addMetric('CacheHits', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();
}; 