import { EventBridgeEvent, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { getParameter } from '../../services/parameter';
import { updateRuleSchedule } from '../../services/eventbridge';

const logger = new Logger({ serviceName: 'update-schedule' });
const tracer = new Tracer({ serviceName: 'update-schedule' });
const metrics = new Metrics({ namespace: 'update-schedule' });

/**
 * Lambda handler triggered by Parameter Store change events
 * Updates an EventBridge rule with the new schedule expression
 */
export const handler = async (
  event: EventBridgeEvent<'Parameter Store Change', { name: string }>,
  context: Context
): Promise<void> => {
  logger.appendKeys({
    requestId: context.awsRequestId,
    correlationIds: {
      awsRequestId: context.awsRequestId,
    },
  });

  logger.info('Update Schedule Lambda invoked', { event });
  metrics.addMetric('InvocationCount', MetricUnit.Count, 1);

  try {
    // Get the parameter name from the event
    const parameterName = event.detail.name;
    logger.info('Parameter change detected', { parameterName });

    // Get the rule name from environment variables
    const ruleName = process.env.RULE_NAME;
    if (!ruleName) {
      throw new Error('Missing required environment variable: RULE_NAME');
    }

    // Get the updated schedule expression from Parameter Store
    const scheduleExpression = await getParameter(parameterName);
    if (!scheduleExpression) {
      throw new Error(`No value found for parameter: ${parameterName}`);
    }

    logger.info('Retrieved schedule expression', {
      parameterName,
      scheduleExpression
    });

    // Update the EventBridge rule with the new schedule
    await updateRuleSchedule(ruleName, scheduleExpression);

    logger.info('Successfully updated EventBridge rule', {
      ruleName,
      scheduleExpression
    });

    metrics.addMetric('SuccessCount', MetricUnit.Count, 1);
  } catch (error) {
    logger.error('Error updating EventBridge rule schedule', { error });
    metrics.addMetric('ErrorCount', MetricUnit.Count, 1);
    throw error;
  }
};
