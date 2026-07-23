/**
 * Public API of the documents module (PRD 3. fejezet – Dokumentumfeldolgozás,
 * 5. fejezet – Fájlbiztonság).
 */
export {
  detectType,
  DETECTED_TYPE_MIME,
  type DetectedType,
} from './magic-numbers';

export {
  validateUpload,
  DEFAULT_MAX_UPLOAD_BYTES,
  type FileUploadIssue,
  type FileUploadInput,
  type FileValidationResult,
  type FileValidationOptions,
} from './file-security';

export {
  evaluateQuality,
  QUALITY_ISSUES,
  DEFAULT_QUALITY_THRESHOLDS,
  type QualityIssue,
  type QualityMetrics,
  type QualityThresholds,
  type QualityResult,
} from './quality';

export {
  generateA4Pdf,
  A4_WIDTH_PT,
  A4_HEIGHT_PT,
  TARGET_DPI,
  type PdfImageType,
  type PdfPageImage,
  type GeneratePdfOptions,
} from './pdf';
