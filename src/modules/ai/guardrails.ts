/**
 * Restoration authenticity guardrails (PRD 3. fejezet – Az AI mit módosíthat /
 * mit NEM módosíthat, Dokumentum hitelesség).
 *
 * The document must always remain an authentic copy. The AI may improve
 * *readability* only; it may never change *content*. These constants are the
 * single source of truth for what is allowed, and they are compiled into the
 * provider prompt so the model is constrained explicitly.
 */

export const ALLOWED_ADJUSTMENTS = [
  'perspective',
  'noise',
  'shadow',
  'background',
  'lighting',
  'white_balance',
  'slight_blur',
  'slight_distortion',
  'page_edges',
  'auto_crop',
  'document_alignment',
] as const;

export const FORBIDDEN_MODIFICATIONS = [
  'inventing_characters',
  'correcting_numbers',
  'changing_dates',
  'regenerating_handwriting',
  'altering_signatures',
  'altering_stamps',
  'inventing_missing_parts',
  'completing_unreadable_data',
] as const;

export type AllowedAdjustment = (typeof ALLOWED_ADJUSTMENTS)[number];
export type ForbiddenModification = (typeof FORBIDDEN_MODIFICATIONS)[number];

/**
 * Builds the system prompt handed to a vision model. It is deliberately strict:
 * the model restores appearance and must leave every character, number, date,
 * signature and stamp exactly as-is. Unreadable data stays unreadable.
 */
export function buildRestorationSystemPrompt(): string {
  return [
    'You are a document restoration engine for freight documents.',
    'Your ONLY task is to make the photographed document look like a clean,',
    'professional A4 scan while preserving it as an authentic copy.',
    '',
    'You MAY adjust only the visual presentation:',
    ...ALLOWED_ADJUSTMENTS.map((item) => `  - ${item}`),
    '',
    'You MUST NOT change any content. It is strictly forbidden to:',
    ...FORBIDDEN_MODIFICATIONS.map((item) => `  - ${item}`),
    '',
    'If any data is unreadable, leave it unreadable. Never invent, complete,',
    'correct or regenerate characters, numbers, dates, handwriting, signatures',
    'or stamps. The output must remain a faithful copy of the original.',
  ].join('\n');
}

/** Current prompt/pipeline version tag, recorded on every AI job. */
export const RESTORATION_PROMPT_VERSION = 'restore-v1';
