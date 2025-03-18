# Apple Music API Integration Layer

This integration layer provides a robust, cost-effective interface between the frontend application and the Apple Music API. It handles data fetching, multi-level caching, rate limiting, and manages the manual token update process required by the Apple Music API.

## Architecture Overview

The architecture is optimized for a traffic pattern of ~100 daily users with occasional spikes up to 25K users and includes the following components:

1. **API Gateway**: Entry point for all incoming requests from the frontend.

2. **Integration Layer (AWS Lambda Functions)**:
   - **Data Fetching Lambda**: Retrieves and processes data from the Apple Music API.
   - **Token Refresh Lambda**: Handles sending notifications when the token needs refreshing.
   - **DLQ Processor Lambda**: Processes failed requests after token refresh.

3. **External Cache (Upstash Redis)**: Provides a serverless, cost-effective Redis cache for storing frequently accessed data.

4. **Asynchronous Task Processing (AWS SQS)**: Queues failed requests for later processing.

5. **Notification System (AWS SNS & SES)**: Sends notifications when the token needs manual refreshing.

6. **SSM Parameter Store**: Securely stores the Apple Music API token.

## Multi-Level Caching Strategy

The integration layer implements a two-level caching approach:

- **L1 Cache**: In-Lambda memory cache leveraging the Lambda execution context persistence.
- **L2 Cache**: Upstash Redis providing cross-invocation persistence.

## Workflow

1. Frontend sends a request to the API Gateway.
2. API Gateway routes the request to the Data Fetching Lambda.
3. Data Fetching Lambda:
   - Checks in-memory cache first (L1). If hit, returns data immediately.
   - Checks Upstash Redis cache (L2). If hit, stores in L1 and returns data.
   - If both caches miss, retrieves the Apple Music API token from SSM Parameter Store.
   - Fetches data from the Apple Music API, caches it in both L1 and L2, and returns it.
   - If the Apple Music API returns a token expiration error:
     - Publishes a message to an SNS Topic to trigger the Token Refresh Lambda.
     - Sends the failed request to the DLQ (AWS SQS).
     - Returns an error to the API Gateway.
4. Token Refresh Lambda sends an email notification to the admin.
5. Admin manually refreshes the token via the admin portal.
6. Failed requests are retrieved from the DLQ and retried by the DLQ Processor Lambda.

## Monitoring

The integration layer includes a CloudWatch dashboard for monitoring:

- Lambda invocations, errors, and durations
- Cache hit rates
- SQS queue metrics
- SNS notification delivery rates
- Error logs across all Lambda functions

## Deployment

The integration layer is deployed using AWS CDK. To deploy:

```bash
# Install dependencies
pnpm install -C src/app/backend/handlers/apple-music-api/apple-music-api-nodejs

# Build the Lambda functions
pnpm build:lambda-apple-music-api

# Deploy the infrastructure
pnpm deploy:apple-music-api
```

## Token Management

The Apple Music API token is stored in AWS SSM Parameter Store as a SecureString. When the token expires, an email notification is sent to the admin, who must manually update the token through the admin portal or directly in the SSM Parameter Store.

After updating the token, any failed requests in the DLQ will be automatically retried.

## Cost Optimization

The serverless approach with pay-per-use components (Lambda, Upstash Redis, SQS) keeps costs minimal during normal operation and scales efficiently during traffic spikes.

## Error Handling

Robust error handling detects token expiration and triggers the refresh process. Failed requests are queued in SQS and retried after the token is refreshed. 