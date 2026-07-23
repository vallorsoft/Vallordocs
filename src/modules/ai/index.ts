/**
 * Public API of the AI module (PRD 3. fejezet – AI dokumentumfeldolgozás).
 */
export {
  RESTORATION_STEPS,
  PROCESSING_STAGES,
  nextStep,
  type RestorationStep,
  type ProcessingStage,
} from './pipeline';

export {
  ALLOWED_ADJUSTMENTS,
  FORBIDDEN_MODIFICATIONS,
  RESTORATION_PROMPT_VERSION,
  buildRestorationSystemPrompt,
  type AllowedAdjustment,
  type ForbiddenModification,
} from './guardrails';

export {
  GeminiProvider,
  DEFAULT_GEMINI_MODEL,
  type GeminiProviderConfig,
  type GeminiTransport,
  type GeminiTransportRequest,
  type GeminiTransportResponse,
} from './gemini-provider';

export { createAiProvider } from './factory';

export type { AiProvider, RestorationInput, RestorationResult } from './types';
