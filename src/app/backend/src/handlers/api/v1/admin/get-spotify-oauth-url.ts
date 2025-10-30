import { Logger } from '@aws-lambda-powertools/logger';
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { generateSpotifyAuthUrl } from '@services/spotify';
import {
  generateCodeChallenge,
  generateCodeVerifier,
} from '@services/spotify/pkce';
import { updateParameter } from '@services/parameter';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomBytes } from 'crypto';

const logger = new Logger({ serviceName: 'spotify-oauth-url' });

/**
 * Lambda handler for generating Spotify OAuth URL with PKCE
 * GET /spotify/oauth/url
 * Returns authorization URL, state, and code verifier for PKCE flow
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'spotify-oauth-url' },
  async (event, context, utils) => {
    const rateLimitResponse = await checkRateLimit(event, {
      ...RATE_LIMITS.ADMIN,
      logger: utils.logger,
      metrics: utils.metrics,
    });

    if (rateLimitResponse) {
      return rateLimitResponse as APIGatewayProxyResult;
    }

    try {
      logger.info('Generating Spotify OAuth URL with PKCE');

      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      // Generate state for CSRF protection (16 char random hex)
      const state = randomBytes(8).toString('hex');

      // Store code_verifier and state together in a single fixed parameter
      // Using in-place replacement instead of creating new parameters each time
      const pkceParameterName = '/Music/AdminPanel/Spotify/PKCE/Current';
      const pkceData = JSON.stringify({ state, codeVerifier });
      await updateParameter(pkceParameterName, pkceData);
      logger.info('Stored PKCE code verifier in Parameter Store', {
        state,
        parameterName: pkceParameterName,
      });

      // Generate Spotify auth URL with PKCE parameters
      const authorizationUrl = await generateSpotifyAuthUrl(
        state,
        codeChallenge
      );

      utils.metrics.addMetric('SpotifyOAuthUrlGenerated', MetricUnit.Count, 1);

      logger.info('Successfully generated Spotify OAuth URL', {
        hasCodeChallenge: !!codeChallenge,
        stateLength: state.length,
        codeVerifierLength: codeVerifier.length,
      });

      return utils.createSuccessResponse(event, {
        authorization_url: authorizationUrl,
        state,
        // code_verifier is stored server-side and retrieved during callback
      });
    } catch (error) {
      logger.error('Failed to generate Spotify OAuth URL', { error });
      utils.metrics.addMetric('SpotifyOAuthUrlError', MetricUnit.Count, 1);

      return utils.createErrorResponse(
        event,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to generate Spotify authorization URL'
      );
    }
  }
);
