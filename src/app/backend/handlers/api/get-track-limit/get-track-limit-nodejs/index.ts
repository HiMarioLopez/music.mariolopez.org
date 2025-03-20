import { APIGatewayProxyHandler } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient();
const PARAMETER_NAME = process.env.PARAMETER_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log('Get Track Limit Lambda invoked');
    console.log('Event:', JSON.stringify(event));

    try {
        const response = await ssmClient.send(
            new GetParameterCommand({
                Name: PARAMETER_NAME,
                WithDecryption: false
            })
        );

        const trackLimit = response.Parameter?.Value;
        if (!trackLimit) {
            throw new Error('Track limit parameter not found');
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({
                trackLimit: parseInt(trackLimit, 10)
            })
        };
    } catch (error) {
        console.error('Error getting track limit:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({
                message: 'Error retrieving track limit',
                error: (error as Error).message
            })
        };
    }
}; 