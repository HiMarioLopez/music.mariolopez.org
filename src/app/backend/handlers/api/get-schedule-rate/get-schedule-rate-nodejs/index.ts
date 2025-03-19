import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const PARAMETER_NAME = process.env.PARAMETER_NAME || '/music/schedule-rate';
const ssmClient = new SSMClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const command = new GetParameterCommand({
            Name: PARAMETER_NAME,
        });

        const response = await ssmClient.send(command);
        const value = response.Parameter?.Value;

        if (!value) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ error: 'Parameter not found' }),
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ rate: value }),
        };
    } catch (error) {
        console.error('Error getting parameter:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
}; 