import { InternalError } from '@/shared/errors';
import {
  buildRestorationSystemPrompt,
  RESTORATION_PROMPT_VERSION,
} from './guardrails';
import type { AiProvider, RestorationInput, RestorationResult } from './types';

/**
 * Google Gemini restoration provider (PRD 3. fejezet – AI szolgáltató).
 *
 * The network transport is injected so the request-building and result-mapping
 * logic is fully unit-testable without calling the live API. The default
 * transport performs the real Gemini `generateContent` request.
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

export interface GeminiTransportRequest {
  apiKey: string;
  model: string;
  systemPrompt: string;
  imageBase64: string;
  mimeType: string;
}

export interface GeminiTransportResponse {
  imageBase64: string;
  mimeType: string;
  tokensUsed?: number;
}

export type GeminiTransport = (
  request: GeminiTransportRequest,
) => Promise<GeminiTransportResponse>;

export interface GeminiProviderConfig {
  apiKey: string;
  model?: string;
  transport?: GeminiTransport;
}

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini' as const;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly transport: GeminiTransport;

  constructor(config: GeminiProviderConfig) {
    if (!config.apiKey) {
      throw new InternalError({ message: 'GEMINI_API_KEY is not configured' });
    }
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_GEMINI_MODEL;
    this.transport = config.transport ?? defaultGeminiTransport;
  }

  async restore(input: RestorationInput): Promise<RestorationResult> {
    const response = await this.transport({
      apiKey: this.apiKey,
      model: this.model,
      systemPrompt: buildRestorationSystemPrompt(),
      imageBase64: input.image.toString('base64'),
      mimeType: input.contentType,
    });

    return {
      image: Buffer.from(response.imageBase64, 'base64'),
      contentType: response.mimeType,
      model: this.model,
      promptVersion: RESTORATION_PROMPT_VERSION,
      tokensUsed: response.tokensUsed,
    };
  }
}

/**
 * Default transport: calls the Gemini REST API. Kept separate and untested
 * against the network; the provider's logic is exercised via injected
 * transports in unit tests.
 */
const defaultGeminiTransport: GeminiTransport = async (request) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': request.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: request.systemPrompt }] },
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: request.mimeType,
                data: request.imageBase64,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    // Never surface the raw provider response to the caller.
    throw new InternalError({
      message: `Gemini request failed with status ${res.status}`,
    });
  }

  const body: unknown = await res.json();
  const part = extractInlineImage(body);
  if (!part) {
    throw new InternalError({ message: 'Gemini returned no image data' });
  }
  return part;
};

interface GeminiApiPart {
  inlineData?: { mimeType?: string; data?: string };
}
interface GeminiApiResponse {
  candidates?: Array<{ content?: { parts?: GeminiApiPart[] } }>;
  usageMetadata?: { totalTokenCount?: number };
}

function extractInlineImage(body: unknown): GeminiTransportResponse | null {
  const response = body as GeminiApiResponse;
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        imageBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType ?? 'image/png',
        tokensUsed: response.usageMetadata?.totalTokenCount,
      };
    }
  }
  return null;
}
