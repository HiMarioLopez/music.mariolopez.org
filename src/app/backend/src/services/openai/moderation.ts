import { Logger } from '@aws-lambda-powertools/logger';
import OpenAI from 'openai';
import { ModerationCheckResult } from '../../models/moderation-check-result';
import { getParameter } from '../parameter';

// Create logger for the OpenAI moderation service
const logger = new Logger({ serviceName: 'openai-moderation-service' });

// OpenAI client instance (will be initialized lazily)
let openaiClient: OpenAI | null = null;

/**
 * Initialize the OpenAI client
 * @returns Initialized OpenAI client
 */
async function getOpenAIClient(): Promise<OpenAI> {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKeyParameter = process.env.OPENAI_API_KEY_PARAMETER;
  if (!apiKeyParameter) {
    throw new Error('OPENAI_API_KEY_PARAMETER environment variable not set');
  }

  const apiKey = await getParameter(apiKeyParameter);
  if (!apiKey) {
    throw new Error(`Failed to retrieve OpenAI API Key from parameter: ${apiKeyParameter}`);
  }

  openaiClient = new OpenAI({
    apiKey,
  });

  return openaiClient;
}

/**
 * Check text content with OpenAI's moderation API
 * 
 * @param content The text content to check (typically a note in a recommendation)
 * @returns Moderation result with flagged status and details
 */
export async function checkModeration(content: string): Promise<ModerationCheckResult> {
  if (!content || content.trim() === '') {
    logger.info('Empty content provided for moderation check, returning not flagged');
    return {
      flagged: false,
      categories: {},
      categoryScores: {},
      flags: []
    };
  }

  try {
    logger.debug('Sending content to OpenAI Moderation API', { contentLength: content.length });

    const client = await getOpenAIClient();
    const moderationResponse = await client.moderations.create({
      input: content,
    });

    const result = moderationResponse.results[0];

    // Collect the flagged categories for better feedback
    const flags = Object.keys(result.categories)
      .filter(category => result.categories[category as keyof typeof result.categories])
      .map(category => category);

    logger.info('Moderation check completed', {
      flagged: result.flagged,
      flags,
      flagsCount: flags.length
    });

    return {
      flagged: result.flagged,
      categories: result.categories as unknown as Record<string, boolean>,
      categoryScores: result.category_scores as unknown as Record<string, number>,
      flags
    };
  } catch (error) {
    logger.error('Error during moderation check', { error });

    // In case of error, we need to be cautious and return flagged=true to prevent
    // potentially harmful content from being published without review
    return {
      flagged: true,
      categories: {},
      categoryScores: {},
      flags: ['error_during_moderation_check']
    };
  }
}
