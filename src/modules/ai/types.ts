import type { AiProvider as AiProviderName } from '@prisma/client';

/**
 * AI provider abstraction (PRD 3. fejezet – AI szolgáltató).
 *
 * The AI module is a document *restorer*, not an OCR engine. Its single job is
 * to make a photographed document look as if it had been scanned, without ever
 * altering its content. Providers (Gemini, OpenAI, Claude, Vertex AI) implement
 * this interface so the active provider is a configuration choice.
 */

export interface RestorationInput {
  /** Raw bytes of the original photo. Never mutated. */
  image: Buffer;
  /** MIME type of the input image, e.g. `image/jpeg`. */
  contentType: string;
}

export interface RestorationResult {
  /** Restored image bytes, suitable for PDF generation. */
  image: Buffer;
  contentType: string;
  /** Model identifier that produced the result (for the AI job log). */
  model: string;
  /** Version tag of the restoration prompt/pipeline used. */
  promptVersion: string;
  /** Tokens consumed, when the provider reports them. */
  tokensUsed?: number;
}

export interface AiProvider {
  /** Provider discriminator, mirrored into the `ai_jobs` table. */
  readonly name: AiProviderName;
  /** Restores a single document image. Must never fabricate content. */
  restore(input: RestorationInput): Promise<RestorationResult>;
}
