import { describe, expect, it, vi } from 'vitest';
import {
  GeminiProvider,
  DEFAULT_GEMINI_MODEL,
  type GeminiTransport,
} from './gemini-provider';
import { RESTORATION_PROMPT_VERSION } from './guardrails';
import { AppError } from '@/shared/errors';

const originalImage = Buffer.from('original-photo-bytes');
const restoredImage = Buffer.from('restored-scan-bytes');

describe('GeminiProvider', () => {
  it('requires an API key', () => {
    expect(() => new GeminiProvider({ apiKey: '' })).toThrow(AppError);
  });

  it('sends the authenticity system prompt and the base64 image', async () => {
    const transport = vi.fn<GeminiTransport>(async (request) => {
      expect(request.systemPrompt).toMatch(/MUST NOT change any content/);
      expect(request.imageBase64).toBe(originalImage.toString('base64'));
      expect(request.model).toBe(DEFAULT_GEMINI_MODEL);
      return {
        imageBase64: restoredImage.toString('base64'),
        mimeType: 'image/png',
        tokensUsed: 42,
      };
    });

    const provider = new GeminiProvider({ apiKey: 'key', transport });
    const result = await provider.restore({
      image: originalImage,
      contentType: 'image/jpeg',
    });

    expect(transport).toHaveBeenCalledOnce();
    expect(result.image.equals(restoredImage)).toBe(true);
    expect(result.contentType).toBe('image/png');
    expect(result.model).toBe(DEFAULT_GEMINI_MODEL);
    expect(result.promptVersion).toBe(RESTORATION_PROMPT_VERSION);
    expect(result.tokensUsed).toBe(42);
  });

  it('honours a custom model', async () => {
    const transport: GeminiTransport = async () => ({
      imageBase64: restoredImage.toString('base64'),
      mimeType: 'image/png',
    });
    const provider = new GeminiProvider({
      apiKey: 'key',
      model: 'gemini-custom',
      transport,
    });
    const result = await provider.restore({
      image: originalImage,
      contentType: 'image/jpeg',
    });
    expect(result.model).toBe('gemini-custom');
  });
});
