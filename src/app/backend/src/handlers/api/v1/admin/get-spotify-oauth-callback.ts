import { Logger } from '@aws-lambda-powertools/logger';
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { RATE_LIMITS } from '@config/rate-limits';
import { exchangeCodeForToken } from '@services/spotify';
import { getParameter } from '@services/parameter';
import { wrapHandler } from '@utils/lambda-handler';
import { checkRateLimit } from '@utils/rate-limiter';
import { HttpStatus } from '@utils/types';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const logger = new Logger({ serviceName: 'spotify-oauth-callback' });

/**
 * Lambda handler for Spotify OAuth callback
 * GET /spotify/oauth/callback?code=...&state=...
 * Exchanges authorization code for tokens and stores them securely
 */
export const handler = wrapHandler<APIGatewayProxyEvent, APIGatewayProxyResult>(
  { serviceName: 'spotify-oauth-callback' },
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
      // Extract OAuth parameters from query string
      const { code, state } = event.queryStringParameters || {};

      if (!code) {
        return utils.createErrorResponse(
          event,
          new Error('Missing authorization code'),
          HttpStatus.BAD_REQUEST,
          'Authorization code is required'
        );
      }

      if (!state) {
        return utils.createErrorResponse(
          event,
          new Error('Missing state parameter'),
          HttpStatus.BAD_REQUEST,
          'State parameter is required'
        );
      }

      logger.info('Processing Spotify OAuth callback', {
        codePresent: !!code,
        stateLength: state?.length,
      });

      // Retrieve code_verifier from Parameter Store using state
      const pkceParameterName = `/Music/AdminPanel/Spotify/PKCE/${state}`;
      const codeVerifier = await getParameter(pkceParameterName);

      if (!codeVerifier) {
        return utils.createErrorResponse(
          event,
          new Error('Missing code verifier'),
          HttpStatus.BAD_REQUEST,
          'Code verifier not found for this state. It may have expired or been used already.'
        );
      }

      // Exchange authorization code for tokens (this also stores them in Parameter Store)
      const tokenResponse = await exchangeCodeForToken(code, codeVerifier);

      utils.metrics.addMetric(
        'SpotifyOAuthCallbackSuccess',
        MetricUnit.Count,
        1
      );

      logger.info('Successfully completed Spotify OAuth flow', {
        hasRefreshToken: !!tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
      });

      // Redirect back to admin panel with success indicator
      // The frontend will handle checking status after redirect
      const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'https://admin.music.mariolopez.org';
      const redirectUrl = `${adminPanelUrl}?spotify_auth=success`;

      return {
        statusCode: 302,
        headers: {
          Location: redirectUrl,
          'Cache-Control': 'no-cache',
        },
        body: '',
      };
    } catch (error) {
      logger.error('Spotify OAuth callback failed', { error });
      utils.metrics.addMetric('SpotifyOAuthCallbackError', MetricUnit.Count, 1);

      // Handle specific error cases and redirect with error
      const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'https://admin.music.mariolopez.org';
      
      if (error instanceof Error) {
        let errorMessage = 'Failed to complete Spotify authorization';
        if (error.message.includes('invalid_grant')) {
          errorMessage = 'Invalid or expired authorization code';
        }
        
        const redirectUrl = `${adminPanelUrl}?spotify_auth=error&error=${encodeURIComponent(errorMessage)}`;
        
        return {
          statusCode: 302,
          headers: {
            Location: redirectUrl,
            'Cache-Control': 'no-cache',
          },
          body: '',
        };
      }

      const redirectUrl = `${adminPanelUrl}?spotify_auth=error&error=${encodeURIComponent('Unknown error')}`;
      return {
        statusCode: 302,
        headers: {
          Location: redirectUrl,
          'Cache-Control': 'no-cache',
        },
        body: '',
      };
    }
  }
);
