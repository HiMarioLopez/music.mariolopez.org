import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';

export const metrics = new Metrics({
    namespace: 'MusicBrainzAPI',
    serviceName: 'MusicBrainzDataFetching'
});
export const logger = new Logger({ serviceName: 'MusicBrainzDataFetching' });
export const tracer = new Tracer({ serviceName: 'MusicBrainzDataFetching' });

export const emitCacheMetric = async (source: 'cache' | 'api'): Promise<void> => {
    metrics.addDimension('Source', source);
    metrics.addMetric('CacheHits', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();
}; 