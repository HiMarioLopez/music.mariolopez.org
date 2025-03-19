# Apple Music History API

This Lambda function serves the Apple Music listening history stored in DynamoDB. It provides a RESTful API endpoint that allows querying the history with pagination and filtering capabilities.

## Features

- Fetch all music history with pagination
- Filter tracks by artist name
- Sort tracks by play date (newest first)
- CORS enabled for cross-origin requests
- Rate limiting and maximum result limits

## Environment Variables

- `DYNAMODB_TABLE_NAME`: The name of the DynamoDB table storing the music history

## API Endpoints

### GET /history

Fetches the music history with optional filtering and pagination.

#### Query Parameters

- `limit` (optional): Number of items to return (default: 50, max: 100)
- `artist` (optional): Filter tracks by artist name
- `startKey` (optional): Token for pagination (returned in previous response)

#### Response

```typescript
{
    items: Array<{
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
        playedDate: string;
    }>;
    pagination: {
        count: number;
        hasMore: boolean;
        nextToken?: string;
    };
}
```

## Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the project:
   ```bash
   pnpm run build
   ```

3. Run tests:
   ```bash
   pnpm test
   ```

4. Development mode with auto-rebuild:
   ```bash
   pnpm run dev
   ```

## Deployment

The Lambda function is deployed through AWS SAM/CloudFormation. The deployment process is handled by the main project's infrastructure code. 