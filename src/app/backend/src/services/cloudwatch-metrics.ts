import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { CloudWatchClient, MetricDatum, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const logger = new Logger({ serviceName: 'cloudwatch-metrics-service' });
const tracer = new Tracer({ serviceName: 'cloudwatch-metrics-service' });

const cloudWatchClient = new CloudWatchClient();

// Instrument the AWS client with tracer
tracer.captureAWSv3Client(cloudWatchClient);

/**
 * Put metrics to CloudWatch
 * 
 * @param namespace - CloudWatch namespace
 * @param metrics - Array of metrics to publish
 * @returns Promise that resolves when metrics are published
 */
export const putCloudWatchMetrics = async (
    namespace: string,
    metrics: { name: string; value: number; unit: string }[]
): Promise<void> => {
    try {
        const timestamp = new Date();

        await cloudWatchClient.send(
            new PutMetricDataCommand({
                Namespace: namespace,
                MetricData: metrics.map(metric => ({
                    MetricName: metric.name,
                    Value: metric.value,
                    Unit: metric.unit,
                    Timestamp: timestamp
                })) as MetricDatum[]
            })
        );

        logger.info('Successfully published CloudWatch metrics', {
            namespace,
            metricCount: metrics.length
        });
    } catch (error) {
        logger.error('Error publishing CloudWatch metrics', { namespace, error });
        throw error;
    }
};
