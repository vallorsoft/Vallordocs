/**
 * Document restoration pipeline definition (PRD 3. fejezet – AI feldolgozási
 * folyamat).
 *
 * These are the ordered visual-restoration steps every document goes through.
 * They are declared as data so the orchestrator, the provider prompt and the UI
 * status labels all share one source of truth.
 */

export const RESTORATION_STEPS = [
  'perspective_correction',
  'edge_detection',
  'auto_crop',
  'shadow_removal',
  'background_removal',
  'geometry_correction',
  'contrast_optimization',
  'white_balance',
  'denoise',
  'sharpen',
  'a4_fit',
] as const;

export type RestorationStep = (typeof RESTORATION_STEPS)[number];

/** The end-to-end document processing lifecycle (PRD 3. fejezet – folyamat). */
export const PROCESSING_STAGES = [
  'uploaded',
  'quality_checked',
  'restoring',
  'generating_pdf',
  'stored',
  'notified',
] as const;

export type ProcessingStage = (typeof PROCESSING_STAGES)[number];

/** Returns the step that follows `step`, or null when it is the last one. */
export function nextStep(step: RestorationStep): RestorationStep | null {
  const index = RESTORATION_STEPS.indexOf(step);
  if (index === -1 || index === RESTORATION_STEPS.length - 1) return null;
  return RESTORATION_STEPS[index + 1] ?? null;
}
