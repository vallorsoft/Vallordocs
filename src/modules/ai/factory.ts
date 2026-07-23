import { getEnv } from '@/config';
import { InternalError } from '@/shared/errors';
import { GeminiProvider } from './gemini-provider';
import type { AiProvider } from './types';

/**
 * AI provider factory (PRD 3. fejezet – AI szolgáltató).
 *
 * The active provider is selected from configuration. Only Gemini is
 * implemented in this milestone; the other providers plug in behind the same
 * interface without touching calling code.
 */
export function createAiProvider(): AiProvider {
  const env = getEnv();

  switch (env.AI_PROVIDER) {
    case 'gemini': {
      if (!env.GEMINI_API_KEY) {
        throw new InternalError({
          message: 'GEMINI_API_KEY is required when AI_PROVIDER=gemini',
        });
      }
      return new GeminiProvider({ apiKey: env.GEMINI_API_KEY });
    }
    case 'openai':
    case 'claude':
    case 'vertexai':
      throw new InternalError({
        message: `AI provider not yet implemented: ${env.AI_PROVIDER}`,
      });
    default: {
      const exhaustive: never = env.AI_PROVIDER;
      throw new InternalError({
        message: `Unknown AI provider: ${String(exhaustive)}`,
      });
    }
  }
}
