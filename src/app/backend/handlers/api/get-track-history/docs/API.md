# Apple Music History API Documentation

This document describes the API endpoints for accessing your Apple Music listening history.

## Base URL

The API is available at: `https://{api_id}.execute-api.{region}.amazonaws.com/prod/history/music`

## Authentication

Currently, the API does not require authentication.

## Endpoints

### Get All Tracks

Retrieve a paginated list of tracks from your listening history, sorted by most recently played first.

**URL**: `/history/music`

**Method**: `GET`

**Query Parameters**:

| Parameter | Type    | Description                                            | Default | Max   |
|-----------|---------|--------------------------------------------------------|---------|-------|
| limit     | Integer | Number of tracks to return per page                    | 50      | 100   |
| startKey  | String  | Pagination token for retrieving the next page of items | -       | -     |

**Response**:

```json
{
  "items": [
    {
      "id": "hash_id",
      "trackId": "original_apple_music_id",
      "artistName": "Artist Name",
      "name": "Track Name",
      "albumName": "Album Name",
      "genreNames": ["Genre1", "Genre2"],
      "trackNumber": 1,
      "durationInMillis": 240000,
      "releaseDate": "2023-01-01",
      "isrc": "ISRC123456789",
      "artworkUrl": "https://example.com/artwork.jpg",
      "composerName": "Composer Name",
      "url": "https://music.apple.com/track/123",
      "hasLyrics": true,
      "isAppleDigitalMaster": true,
      "playedDate": "2023-04-20T15:30:00Z"
    },
    // More tracks...
  ],
  "pagination": {
    "count": 50,
    "hasMore": true,
    "nextToken": "encoded_pagination_token"
  }
}
```

**Example**:

```
GET /history/music?limit=10
```

### Get Tracks by Artist

Retrieve a paginated list of tracks by a specific artist, sorted by most recently played first.

**URL**: `/history/music`

**Method**: `GET`

**Query Parameters**:

| Parameter | Type    | Description                                            | Default | Max   |
|-----------|---------|--------------------------------------------------------|---------|-------|
| artist    | String  | Artist name to filter by (case-sensitive contains)     | -       | -     |
| limit     | Integer | Number of tracks to return per page                    | 50      | 100   |
| startKey  | String  | Pagination token for retrieving the next page of items | -       | -     |

**Response**:

Same structure as "Get All Tracks"

**Example**:

```
GET /history/music?artist=Taylor%20Swift&limit=10
```

## Pagination

To retrieve the next page of results, use the `nextToken` value from the previous response as the `startKey` parameter:

```
GET /history/music?limit=10&startKey=encoded_pagination_token
```

When there are no more results, the `hasMore` field will be `false` and `nextToken` will be omitted.

## Error Responses

The API returns standard HTTP status codes:

- `200 OK`: The request succeeded
- `400 Bad Request`: The request was invalid
- `500 Internal Server Error`: Something went wrong on the server

Error responses have the following format:

```json
{
  "error": "Error message description"
}
``` 