import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'path-utils' });

/**
 * Extracts the Apple Music API endpoint path from various input formats.
 * 
 * Examples of input paths:
 * - /me/recent/played/tracks (already in correct format)
 * - /v1/apple-music/me/recent/played/tracks
 * - /api/nodejs/v1/apple-music/me/recent/played/tracks
 * - /prod/nodejs/v1/apple-music/me/recent/played/tracks
 * 
 * What we want to extract is: /me/recent/played/tracks
 * 
 * @param path - Input path to clean
 * @returns Cleaned path suitable for the Apple Music API
 */
export const extractAppleMusicEndpoint = (path: string): string => {
  if (!path) {
    logger.error('Invalid or empty path provided', {
      path,
      pathType: typeof path,
    });
    throw new Error('Invalid path: Path cannot be empty');
  }

  logger.info('Starting path extraction process', {
    originalPath: path,
  });

  let cleanPath: string;

  // Step 1: Check if the path directly starts with an Apple Music endpoint
  const directEndpointMatch = path.match(
    /^\/(me|catalog|albums|artists|songs|playlists|stations|charts|search|recommendations|activities|storefronts)\/.*/
  );

  if (directEndpointMatch) {
    // Already in the correct format
    cleanPath = path;
    logger.info('Path is already in Apple Music endpoint format', {
      path: cleanPath,
    });
    return cleanPath;
  }

  // Step 2: Try to extract the endpoint using known Apple endpoint patterns
  const appleEndpointMatch = path.match(
    /\/(me|catalog|albums|artists|songs|playlists|stations|charts|search|recommendations|activities|storefronts)\/.*/
  );

  if (appleEndpointMatch) {
    cleanPath = appleEndpointMatch[0];
    logger.info('Found Apple Music endpoint in path', {
      originalPath: path,
      extractedEndpoint: cleanPath,
    });
    return cleanPath;
  }

  // Step 3: Use common prefixes to extract the relevant part
  const commonPrefixes = [
    '/v1/apple-music',
    '/api/nodejs/v1/apple-music',
    '/prod/nodejs/v1/apple-music',
    '/nodejs/v1/apple-music',
    '/api/v1/apple-music',
    '/api/nodejs/apple-music',
    '/apple-music',
  ];

  for (const prefix of commonPrefixes) {
    if (path.includes(prefix)) {
      // Extract everything after the prefix
      cleanPath = path.substring(path.indexOf(prefix) + prefix.length);
      logger.info('Extracted path using prefix', {
        originalPath: path,
        prefix,
        extractedPath: cleanPath,
      });
      
      // Ensure the path starts with a slash
      if (!cleanPath.startsWith('/')) {
        cleanPath = '/' + cleanPath;
      }
      
      // If we somehow ended up with just a slash, that's an error condition
      if (cleanPath === '/') {
        logger.warn('Path extraction resulted in root path', {
          originalPath: path,
          prefix,
        });
        continue; // Try another prefix
      }
      
      return cleanPath;
    }
  }

  // Step 4: If no matches found, log a warning and return the original path
  logger.warn('Could not identify Apple Music path with known patterns', {
    path,
    willUseAsIs: true,
  });
  
  return path;
};
