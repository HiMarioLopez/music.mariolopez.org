import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { getCorsHeaders } from 'shared/cors-headers';

const ssmClient = new SSMClient({});
const parameterName = process.env.PARAMETER_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get the MUT from Parameter Store
    const response = await ssmClient.send(new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    }));

    if (!response.Parameter?.Value) {
      return {
        statusCode: 404,
        headers: getCorsHeaders(event.headers.origin, 'GET'),
        body: JSON.stringify({ message: 'MUT not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({ musicUserToken: response.Parameter.Value }),
    };
  } catch (error) {
    console.error('Error retrieving MUT:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({ message: 'Error retrieving MUT' }),
    };
  }
}; 