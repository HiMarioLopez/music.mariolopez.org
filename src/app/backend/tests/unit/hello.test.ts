import { Context } from 'aws-lambda';
import { handler } from '../../src/handlers/hello';

// Mock the PowerTools
jest.mock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn()
  }))
}));

jest.mock('@aws-lambda-powertools/tracer', () => ({
  Tracer: jest.fn().mockImplementation(() => ({
    captureAWS: jest.fn()
  }))
}));

jest.mock('@aws-lambda-powertools/metrics', () => ({
  Metrics: jest.fn().mockImplementation(() => ({
    addMetric: jest.fn()
  })),
  MetricUnit: {
    Count: 'Count'
  }
}));

describe('Hello Handler', () => {
  it('returns a 200 response with the expected message', async () => {
    // Create mock event and context
    const event = {} as any;
    const context = { awsRequestId: 'test-id' } as Context;
    
    // Execute the handler
    const response = await handler(event, context);
    
    // Verify the response
    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('message', 'Hello from Lambda!');
    expect(body).toHaveProperty('requestId', 'test-id');
  });
});