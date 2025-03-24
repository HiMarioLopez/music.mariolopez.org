/**
 * CORS utility functions
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://music.mariolopez.org',
  'https://www.music.mariolopez.org',
  'http://localhost:3000'
];

/**
 * Generate appropriate CORS headers based on origin and method
 * 
 * @param origin - The request origin
 * @param methods - Comma-separated list of allowed methods
 * @returns Object containing CORS headers
 */
export const getCorsHeaders = (origin?: string, methods = 'GET,OPTIONS'): Record<string, string> => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
  };

  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
};
