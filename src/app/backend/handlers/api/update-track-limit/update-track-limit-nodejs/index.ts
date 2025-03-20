import { APIGatewayProxyHandler } from 'aws-lambda';
import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient();
const PARAMETER_NAME = process.env.PARAMETER_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log('Update Track Limit Lambda invoked');
    console.log('Event:', JSON.stringify(event));

    try {
        if (!event.body) {
            throw new Error('Request body is required');
        }

        const body = JSON.parse(event.body);
        const trackLimit = body.trackLimit;

        if (typeof trackLimit !== 'number' || trackLimit < 1 || trackLimit > 30) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true
                },
                body: JSON.stringify({
                    message: 'Invalid track limit. Must be a number between 1 and 30.'
                })
            };
        }

        await ssmClient.send(
            new PutParameterCommand({
                Name: PARAMETER_NAME,
                Value: trackLimit.toString(),
                Type: 'String',
                Overwrite: true
            })
        );

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({
                message: 'Track limit updated successfully',
                trackLimit
            })
        };
    } catch (error) {
        console.error('Error updating track limit:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({
                message: 'Error updating track limit',
                error: (error as Error).message
            })
        };
    }
}; 