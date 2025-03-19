# Apple Music History Tracker

This component automatically fetches and stores your Apple Music listening history for later retrieval and display.

## Architecture

The component consists of:

1. **Scheduled Lambda Function**: Runs every 5 minutes to fetch recent tracks from Apple Music API, deduplicate them, and store them in DynamoDB
2. **DynamoDB Table**: Stores your listening history with a unique hash ID based on artist, track, and album
3. **API Lambda Function**: Provides access to your listening history data via API Gateway
4. **SSM Parameter**: Stores the ID of the last processed track to enable deduplication
5. **CloudWatch Dashboard**: Visualizes usage metrics and performance data

## Local Development

### Prerequisites

- Node.js 22+
- pnpm
- AWS CDK

### Setup

```bash
# Install dependencies
pnpm install

# Build Lambda functions
pnpm run build:all
```

### Lambda Functions

1. **Tracker (index.js)**: Scheduled Lambda function that fetches and stores Apple Music history
   - Environment variables:
     - `DYNAMODB_TABLE_NAME`: Name of the DynamoDB table
     - `LAST_PROCESSED_TRACK_PARAMETER`: SSM parameter name for last processed track ID
     - `MUSIC_USER_TOKEN_PARAMETER`: SSM parameter name for Apple Music user token

2. **API (api.js)**: API Gateway Lambda function that provides access to stored history
   - Environment variables:
     - `DYNAMODB_TABLE_NAME`: Name of the DynamoDB table
   - Endpoints:
     - `GET /history/music`: Get all tracks (limit via query param)
     - `GET /history/music?artist=<artist>`: Get tracks filtered by artist

## Deployment

The Lambda functions and infrastructure are deployed via AWS CDK. They're included in the `AppleMusicHistoryStack`.

## Database Schema

```typescript
interface Track {
    id: string;              // SHA-256 hash of artist-track-album
    trackId: string;         // Original Apple Music ID
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
    playedDate: string;      // ISO String timestamp of when the track was played
}
```

## How It Works

1. The scheduler triggers the Lambda function every 5 minutes
2. The Lambda function:
   - Retrieves the Apple Music user token from SSM
   - Retrieves the last processed track ID from SSM
   - Fetches recent tracks from Apple Music API
   - Deduplicates tracks based on the last processed track ID
   - Stores new tracks in DynamoDB
   - Updates the last processed track ID in SSM

## Error Handling

- HTTP errors from Apple Music API: Logged with detailed information
- DynamoDB errors: Logged and retried
- Invalid track data: Logged and skipped
- General exceptions: Logged with full stack traces

## Metrics

The following CloudWatch metrics are available:
- `AppleMusicHistory/TracksProcessed`: Number of tracks processed per invocation
- `AppleMusicHistory/NewTracksStored`: Number of new tracks stored per invocation 