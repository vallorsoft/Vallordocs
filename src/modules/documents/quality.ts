/**
 * Photo quality assessment (PRD 3./4. fejezet – Fotó minőségellenőrzés).
 *
 * The capture-time detectors (blur, glare, finger, multiple documents, …) run
 * on the device. This module is the shared vocabulary of quality issues plus a
 * server-side gate that re-evaluates the measurable metrics and merges the
 * client-reported detector flags. If any issue remains, the upload is refused
 * and the precise problems are returned so the driver can be told what to fix.
 */

export const QUALITY_ISSUES = [
  'blurry',
  'motion_blur',
  'too_dark',
  'too_bright',
  'flash_glare',
  'reflection',
  'missing_page_part',
  'cropped_document',
  'multiple_documents',
  'finger_in_frame',
  'wrong_distance',
  'low_resolution',
] as const;

export type QualityIssue = (typeof QUALITY_ISSUES)[number];

export interface QualityMetrics {
  widthPx: number;
  heightPx: number;
  /** Normalised sharpness estimate in [0, 1]; higher is sharper. */
  sharpness: number;
  /** Normalised average brightness in [0, 1]. */
  brightness: number;
  /**
   * Detector flags raised on the device for the issues that cannot be derived
   * from the numeric metrics alone (glare, reflection, finger, …).
   */
  detectedFlags?: QualityIssue[];
}

export interface QualityThresholds {
  minWidthPx: number;
  minHeightPx: number;
  minSharpness: number;
  minBrightness: number;
  maxBrightness: number;
}

export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  minWidthPx: 1000,
  minHeightPx: 1000,
  minSharpness: 0.35,
  minBrightness: 0.2,
  maxBrightness: 0.9,
};

export interface QualityResult {
  acceptable: boolean;
  issues: QualityIssue[];
}

/**
 * Evaluates capture quality. Returns every detected issue; the photo is only
 * acceptable when none remain.
 */
export function evaluateQuality(
  metrics: QualityMetrics,
  thresholds: QualityThresholds = DEFAULT_QUALITY_THRESHOLDS,
): QualityResult {
  const issues = new Set<QualityIssue>(metrics.detectedFlags ?? []);

  if (
    metrics.widthPx < thresholds.minWidthPx ||
    metrics.heightPx < thresholds.minHeightPx
  ) {
    issues.add('low_resolution');
  }

  if (metrics.sharpness < thresholds.minSharpness) issues.add('blurry');
  if (metrics.brightness < thresholds.minBrightness) issues.add('too_dark');
  if (metrics.brightness > thresholds.maxBrightness) issues.add('too_bright');

  return { acceptable: issues.size === 0, issues: [...issues] };
}
