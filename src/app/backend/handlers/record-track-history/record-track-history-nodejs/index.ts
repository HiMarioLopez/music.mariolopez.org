import { ScheduledHandler } from 'aws-lambda';
import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import axios from 'axios';
import { createHash } from 'crypto';

// Environment variables
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
const LAST_PROCESSED_TRACK_PARAMETER = process.env.LAST_PROCESSED_TRACK_PARAMETER!;
const MUSIC_USER_TOKEN_PARAMETER = process.env.MUSIC_USER_TOKEN_PARAMETER!;

// Clients
const ssmClient = new SSMClient();
const dynamodbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamodbClient);
const cloudWatchClient = new CloudWatchClient();

// Types
interface Track {
    id: string;
    artistName: string;
    name: string;
    albumName: string;
    genreNames?: string[];
    trackNumber?: number;
    durationInMillis?: number;
    releaseDate?: string;
    isrc?: string;
    artworkUrl?: string;
    composerName?: string;
    url?: string;
    hasLyrics?: boolean;
    isAppleDigitalMaster?: boolean;
    playedDate: string; // ISO String timestamp of when the track was played
}

/**
 * Lambda handler function
 */
export const handler: ScheduledHandler = async (event) => {
    console.log('Apple Music History Tracker Lambda invoked');
    console.log('Event:', JSON.stringify(event));

    try {
        // Get Apple Music User Token
        const musicUserToken = await getParameter(MUSIC_USER_TOKEN_PARAMETER);
        if (!musicUserToken) {
            throw new Error('Failed to retrieve Apple Music User Token');
        }

        // Get last processed track ID
        const lastProcessedTrackId = await getParameter(LAST_PROCESSED_TRACK_PARAMETER);
        console.log(`Last processed track ID: ${lastProcessedTrackId || 'No previously processed tracks'}`);

        // Fetch recent tracks
        const recentTracks = await fetchRecentTracks(musicUserToken);
        console.log(`Fetched ${recentTracks.length} recent tracks`);

        // Process tracks and filter out already processed ones
        const newTracks = await processTracks(recentTracks, lastProcessedTrackId || '');
        console.log(`Found ${newTracks.length} new tracks to process`);

        // Store new tracks in DynamoDB
        if (newTracks.length > 0) {
            await storeTracksInDynamoDB(newTracks);

            // Update the last processed track ID
            const mostRecentTrackId = newTracks[0].id;
            await updateLastProcessedTrackId(mostRecentTrackId);
            console.log(`Updated last processed track ID to: ${mostRecentTrackId}`);
        } else {
            console.log('No new tracks to store');
        }

        // Put CloudWatch metrics
        await putCloudWatchMetrics(recentTracks.length, newTracks.length);

        console.log({
            message: 'Successfully processed Apple Music history',
            tracksProcessed: recentTracks.length,
            newTracksStored: newTracks.length
        });
    } catch (error) {
        console.error('Error processing Apple Music history:', error);
        throw error;
    }
};

/**
 * Get a parameter from AWS SSM Parameter Store
 */
async function getParameter(parameterName: string): Promise<string | undefined> {
    try {
        const response = await ssmClient.send(
            new GetParameterCommand({
                Name: parameterName,
                WithDecryption: true
            })
        );
        return response.Parameter?.Value;
    } catch (error) {
        if ((error as any).name === 'ParameterNotFound') {
            return undefined;
        }
        console.error(`Error getting parameter ${parameterName}:`, error);
        throw error;
    }
}

/**
 * Update the last processed track ID in AWS SSM Parameter Store
 */
async function updateLastProcessedTrackId(trackId: string): Promise<void> {
    await ssmClient.send(
        new PutParameterCommand({
            Name: LAST_PROCESSED_TRACK_PARAMETER,
            Value: trackId,
            Type: 'String',
            Overwrite: true
        })
    );
}

/**
 * Fetch recent tracks from Apple Music API
 */
async function fetchRecentTracks(musicUserToken: string): Promise<Track[]> {
    try {
        // Note: Using a proxy URL instead of direct Apple Music API 
        // to leverage existing API Gateway and token handling
        const apiUrl = 'https://music.mariolopez.org/api/nodejs/apple-music/v1/me/recent/played/tracks';
        const response = await axios.get(apiUrl, {
            headers: {
                'Music-User-Token': musicUserToken
            },
            params: {
                limit: 25 // Adjust as needed
            },
            timeout: 10000 // 10 second timeout
        });

        // Validate response structure
        if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
            console.error('Invalid response structure from Apple Music API:', JSON.stringify(response.data));
            return [];
        }

        return response.data.data.map((track: any) => {
            try {
                const { attributes, id } = track;

                if (!id || !attributes) {
                    console.warn('Track missing required properties:', JSON.stringify(track));
                    return null;
                }

                return {
                    id,
                    artistName: attributes.artistName || 'Unknown Artist',
                    name: attributes.name || 'Unknown Track',
                    albumName: attributes.albumName || 'Unknown Album',
                    genreNames: attributes.genreNames,
                    trackNumber: attributes.trackNumber,
                    durationInMillis: attributes.durationInMillis,
                    releaseDate: attributes.releaseDate,
                    isrc: attributes.isrc,
                    artworkUrl: attributes.artwork?.url?.replace('{w}', '300').replace('{h}', '300'),
                    composerName: attributes.composerName,
                    url: attributes.url,
                    hasLyrics: attributes.hasLyrics,
                    isAppleDigitalMaster: attributes.isAppleDigitalMaster,
                    playedDate: new Date().toISOString() // Using current time as Apple doesn't provide play timestamp
                };
            } catch (err) {
                console.warn('Error processing track:', err);
                return null;
            }
        }).filter(Boolean) as Track[]; // Remove null entries
    } catch (error) {
        console.error('Error fetching tracks from Apple Music API:', error);

        // Enhanced error logging for network errors
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', {
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers,
                message: error.message
            });
        }

        return [];
    }
}

/**
 * Process tracks and filter out already processed ones
 */
async function processTracks(tracks: Track[], lastProcessedTrackId: string): Promise<Track[]> {
    // If no last processed track ID, return all tracks
    if (!lastProcessedTrackId) {
        return tracks;
    }

    // Find index of the last processed track
    const lastProcessedIndex = tracks.findIndex(track => track.id === lastProcessedTrackId);

    // If not found, return all tracks
    if (lastProcessedIndex === -1) {
        return tracks;
    }

    // Return only tracks newer than the last processed track
    return tracks.slice(0, lastProcessedIndex);
}

/**
 * Store tracks in DynamoDB
 */
async function storeTracksInDynamoDB(tracks: Track[]): Promise<void> {
    let successCount = 0;
    let errorCount = 0;

    for (const track of tracks) {
        try {
            const hashId = createHash('sha256')
                .update(`${track.artistName}-${track.name}-${track.albumName}`)
                .digest('hex');

            // Create a new object without the id property to avoid duplication
            const { id, ...trackWithoutId } = track;

            await docClient.send(
                new PutCommand({
                    TableName: DYNAMODB_TABLE_NAME,
                    Item: {
                        id: hashId,
                        trackId: id, // Store the original id as a different field
                        ...trackWithoutId
                    }
                })
            );

            successCount++;
        } catch (error) {
            errorCount++;
            console.error('Error storing track in DynamoDB:', error, {
                trackId: track.id,
                artistName: track.artistName,
                name: track.name
            });
        }
    }

    console.log(`Track storage results: ${successCount} success, ${errorCount} errors`);

    // If all operations failed, throw an error
    if (errorCount > 0 && successCount === 0) {
        throw new Error(`Failed to store any tracks in DynamoDB. All ${errorCount} operations failed.`);
    }
}

/**
 * Put CloudWatch metrics
 */
async function putCloudWatchMetrics(tracksProcessed: number, newTracksStored: number): Promise<void> {
    await cloudWatchClient.send(
        new PutMetricDataCommand({
            Namespace: 'AppleMusicHistory',
            MetricData: [
                {
                    MetricName: 'TracksProcessed',
                    Value: tracksProcessed,
                    Unit: 'Count',
                    Timestamp: new Date()
                },
                {
                    MetricName: 'NewTracksStored',
                    Value: newTracksStored,
                    Unit: 'Count',
                    Timestamp: new Date()
                }
            ]
        })
    );
} 