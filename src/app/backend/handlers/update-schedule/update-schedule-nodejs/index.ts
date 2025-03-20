import { EventBridgeClient, PutRuleCommand } from "@aws-sdk/client-eventbridge";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const eventbridge = new EventBridgeClient({});
const ssm = new SSMClient({});

export const handler = async (event: any) => {
    // Get the updated schedule from SSM
    const parameterName = event.detail.name;
    console.log('Requesting SSM parameter:', parameterName);

    const parameter = await ssm.send(new GetParameterCommand({
        Name: parameterName
    }));

    const scheduleExpression = parameter.Parameter!.Value!;
    console.log('Received schedule expression:', scheduleExpression);

    try {
        // Update the EventBridge rule
        await eventbridge.send(new PutRuleCommand({
            Name: process.env.RULE_NAME,
            ScheduleExpression: scheduleExpression
        }));

        console.log(`Successfully updated rule ${process.env.RULE_NAME} with schedule: ${scheduleExpression}`);
    } catch (error) {
        console.error('Failed to update EventBridge rule:', {
            ruleName: process.env.RULE_NAME,
            scheduleExpression,
            error
        });
        throw error;
    }
}; 