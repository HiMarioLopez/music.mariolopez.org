import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ScanCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Environment variables
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;

// Clients
const dynamodbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Default limit for queries
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// Define response type
interface PaginatedResponse {
    items: any[];
    pagination: {
        count: number;
        hasMore: boolean;
        nextToken?: string;
    };
}

/**
 * API Gateway handler function to fetch music history
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    console.log('Music History API Lambda invoked');
    console.log('Event:', JSON.stringify(event));

    try {
        // Get query parameters
        const queryParams = event.queryStringParameters || {};
        // Parse limit with fallback to default and cap at maximum
        const limit = Math.min(
            queryParams.limit ? parseInt(queryParams.limit, 10) : DEFAULT_LIMIT,
            MAX_LIMIT
        );
        const artistName = queryParams.artist;
        const startKey = queryParams.startKey ? decodeURIComponent(queryParams.startKey) : undefined;

        // Fetch tracks from DynamoDB
        let result;
        if (artistName) {
            result = await getTracksByArtist(artistName, limit, startKey);
        } else {
            result = await getAllTracks(limit, startKey);
        }

        // Prepare pagination info
        const response: PaginatedResponse = {
            items: result.items,
            pagination: {
                count: result.items.length,
                hasMore: !!result.lastEvaluatedKey
            }
        };

        // Add next page token if there are more results
        if (result.lastEvaluatedKey) {
            response.pagination.nextToken = encodeURIComponent(result.lastEvaluatedKey);
        }

        // Return tracks as JSON response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // For CORS
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Error fetching music history:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // For CORS
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            body: JSON.stringify({ error: 'Failed to fetch music history' })
        };
    }
};

/**
 * Get all tracks from DynamoDB with a limit
 */
async function getAllTracks(limit: number, startKey?: string): Promise<{
    items: any[],
    lastEvaluatedKey?: string
}> {
    try {
        const params: any = {
            TableName: DYNAMODB_TABLE_NAME,
            Limit: limit
        };

        // Add ExclusiveStartKey for pagination if provided
        if (startKey) {
            params.ExclusiveStartKey = { id: startKey };
        }

        const result = await docClient.send(new ScanCommand(params));

        // Sort by played date (newest first)
        const tracks = result.Items || [];
        const sortedTracks = tracks.sort((a, b) => {
            const dateA = new Date(a.playedDate || '').getTime();
            const dateB = new Date(b.playedDate || '').getTime();
            return dateB - dateA; // Descending order (newest first)
        });

        return {
            items: sortedTracks,
            lastEvaluatedKey: result.LastEvaluatedKey?.id
        };
    } catch (error) {
        console.error('Error fetching all tracks:', error);
        return { items: [] };
    }
}

/**
 * Get tracks by artist name from DynamoDB
 */
async function getTracksByArtist(artistName: string, limit: number, startKey?: string): Promise<{
    items: any[],
    lastEvaluatedKey?: string
}> {
    try {
        // Since we don't have a GSI on artistName, we need to scan with a filter
        const params: any = {
            TableName: DYNAMODB_TABLE_NAME,
            FilterExpression: 'contains(artistName, :artistName)',
            ExpressionAttributeValues: {
                ':artistName': artistName
            },
            Limit: limit
        };

        // Add ExclusiveStartKey for pagination if provided
        if (startKey) {
            params.ExclusiveStartKey = { id: startKey };
        }

        const result = await docClient.send(new ScanCommand(params));

        // Sort by played date (newest first)
        const tracks = result.Items || [];
        const sortedTracks = tracks.sort((a, b) => {
            const dateA = new Date(a.playedDate || '').getTime();
            const dateB = new Date(b.playedDate || '').getTime();
            return dateB - dateA; // Descending order (newest first)
        });

        return {
            items: sortedTracks,
            lastEvaluatedKey: result.LastEvaluatedKey?.id
        };
    } catch (error) {
        console.error('Error fetching tracks by artist:', error, { artistName });
        return { items: [] };
    }
} 