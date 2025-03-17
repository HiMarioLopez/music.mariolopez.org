import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({});
const parameterName = process.env.PARAMETER_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing request body' }),
      };
    }

    const { musicUserToken } = JSON.parse(event.body);

    if (!musicUserToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing musicUserToken in request body' }),
      };
    }

    // Store the MUT in Parameter Store
    await ssmClient.send(new PutParameterCommand({
      Name: parameterName,
      Value: musicUserToken,
      Type: 'SecureString',
      Overwrite: true,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'MUT stored successfully' }),
    };
  } catch (error) {
    console.error('Error storing MUT:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error storing MUT' }),
    };
  }
}; 