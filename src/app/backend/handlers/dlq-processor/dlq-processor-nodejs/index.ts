import { SQSEvent, APIGatewayProxyEvent } from 'aws-lambda';
import axios from 'axios';
import {
    SSMClient,
    GetParameterCommand
} from '@aws-sdk/client-ssm';

// Constants
const APPLE_MUSIC_API_BASE_URL = 'https://api.music.apple.com/v1';
const APPLE_MUSIC_TOKEN_PARAM_NAME = '/Music/AdminPanel/MUT';

// AWS clients
const ssmClient = new SSMClient({ region: process.env.AWS_REGION });

/**
 * Lambda handler for processing the DLQ and retrying failed requests
 */
export const handler = async (event: SQSEvent): Promise<void> => {
    try {
        console.log('DLQ processor event received:', JSON.stringify(event));

        // Get fresh token
        const token = await getAppleMusicToken();

        for (const record of event.Records) {
            try {
                // Parse the original API Gateway event
                const originalEvent = JSON.parse(record.body) as APIGatewayProxyEvent;
                console.log(`Processing failed request for path: ${originalEvent.path}`);

                // Retry the request with the fresh token
                const result = await retryRequest(originalEvent, token);
                console.log(`Request retry result: ${JSON.stringify(result)}`);
            } catch (error) {
                console.error('Error processing queue record:', error);
                // Continue processing other records even if one fails
            }
        }

        console.log('DLQ processing completed');
    } catch (error) {
        console.error('Error processing DLQ:', error);
        throw error;
    }
};

/**
 * Get fresh Apple Music API token from SSM Parameter Store
 */
async function getAppleMusicToken(): Promise<string> {
    try {
        const command = new GetParameterCommand({
            Name: APPLE_MUSIC_TOKEN_PARAM_NAME,
            WithDecryption: true
        });

        const response = await ssmClient.send(command);

        if (!response.Parameter?.Value) {
            throw new Error('Token parameter is empty or undefined');
        }

        return response.Parameter.Value;
    } catch (error) {
        console.error('Error fetching Apple Music token:', error);
        throw error;
    }
}

/**
 * Retry the failed request with a fresh token
 */
async function retryRequest(originalEvent: APIGatewayProxyEvent, token: string): Promise<any> {
    try {
        // Extract path and remove both /api and /nodejs/apple-music prefixes
        const path = originalEvent.path
            .replace(/^\/api/, '')
            .replace(/^\/nodejs\/apple-music/, '');
        const queryParams = originalEvent.queryStringParameters || {};

        // Convert query parameters to URL format
        const queryString = Object.entries(queryParams)
            .map(([key, value]) => {
                // Handle null or undefined values by converting to empty string
                const safeValue = value === null || value === undefined ? '' : String(value);
                return `${encodeURIComponent(key)}=${encodeURIComponent(safeValue)}`;
            })
            .join('&');

        const url = `${APPLE_MUSIC_API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;

        // Extract the MUT from the original request headers
        const mut = originalEvent.headers?.['music-user-token'] ||
            originalEvent.headers?.['Music-User-Token'];

        if (!mut) {
            throw new Error('Music-User-Token not found in original request headers');
        }

        // Make the request to Apple Music API with both tokens
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Music-User-Token': mut,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error retrying request:', error);
        throw error;
    }
} 