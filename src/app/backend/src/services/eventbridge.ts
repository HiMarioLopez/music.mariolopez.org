import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { EventBridgeClient, PutRuleCommand } from '@aws-sdk/client-eventbridge';

const logger = new Logger({ serviceName: 'eventbridge-service' });
const tracer = new Tracer({ serviceName: 'eventbridge-service' });

const eventBridgeClient = new EventBridgeClient();

// Instrument the AWS client with tracer
tracer.captureAWSv3Client(eventBridgeClient);

/**
 * Update an EventBridge rule's schedule expression
 * 
 * @param ruleName - The name of the rule to update
 * @param scheduleExpression - The schedule expression to set (rate or cron expression)
 * @returns Promise resolving when the rule is updated
 */
export const updateRuleSchedule = async (
  ruleName: string, 
  scheduleExpression: string
): Promise<void> => {
  try {
    logger.info('Updating EventBridge rule schedule', { 
      ruleName, 
      scheduleExpression 
    });

    await eventBridgeClient.send(new PutRuleCommand({
      Name: ruleName,
      ScheduleExpression: scheduleExpression
    }));

    logger.info('Successfully updated EventBridge rule schedule', { 
      ruleName, 
      scheduleExpression 
    });
  } catch (error) {
    logger.error('Failed to update EventBridge rule schedule', { 
      ruleName, 
      scheduleExpression, 
      error 
    });
    throw error;
  }
};
