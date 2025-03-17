import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

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
        body: JSON.stringify({ message: 'MUT not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ musicUserToken: response.Parameter.Value }),
    };
  } catch (error) {
    console.error('Error retrieving MUT:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error retrieving MUT' }),
    };
  }
}; 