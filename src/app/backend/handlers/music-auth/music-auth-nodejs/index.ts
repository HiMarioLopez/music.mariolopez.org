import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { sign } from 'jsonwebtoken';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { config } from 'dotenv';
import { join } from 'path';
import { getCorsHeaders } from 'shared/cors-headers';

interface Environment {
  APPLE_AUTH_KEY_SECRET_NAME: string;
  APPLE_TEAM_ID: string;
  APPLE_KEY_ID: string;
}

// Load local environment variables if not in production
if (process.env.NODE_ENV !== 'production') {
  const envPath = join(__dirname, 'environments', '.env.local');
  config({ path: envPath });
}

// Helper function to retrieve the PEM private key secret
async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManagerClient({});
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const result = await client.send(command);

  if (!result.SecretString) {
    throw new Error('Secret string is empty');
  }

  return result.SecretString;
}

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get environment variables (either from .env.local or system env vars)
    const env: Environment = {
      APPLE_AUTH_KEY_SECRET_NAME: process.env.APPLE_AUTH_KEY_SECRET_NAME!,
      APPLE_TEAM_ID: process.env.APPLE_TEAM_ID!,
      APPLE_KEY_ID: process.env.APPLE_KEY_ID!
    };

    // Validate environment variables
    const missingVars = Object.entries(env)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Fetch the PEM private key from Secrets Manager
    const applePrivateKey = await getSecret(env.APPLE_AUTH_KEY_SECRET_NAME);

    // Ensure the private key is correctly formatted
    const privateKey = applePrivateKey.replace(/\\n/g, '\n');

    // Generate JWT using the private key
    const token = sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '1h',
      issuer: env.APPLE_TEAM_ID,
      header: {
        alg: 'ES256',
        kid: env.APPLE_KEY_ID
      }
    });

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({ token })
    };

  } catch (error) {
    console.error('Error fetching secret or generating token:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin, 'GET'),
      body: JSON.stringify({
        error: 'Error processing your request',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 