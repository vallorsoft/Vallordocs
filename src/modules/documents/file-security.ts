import {
  detectType,
  DETECTED_TYPE_MIME,
  type DetectedType,
} from './magic-numbers';

/**
 * Upload file-security validation (PRD 5. fejezet – Fájlbiztonság).
 *
 * Every uploaded file is checked before it is ever stored. The checks cover
 * MIME type, extension, maximum size, corrupt/empty files, double extensions
 * and content/signature mismatch. Type is decided from the real bytes, not from
 * client-supplied metadata.
 */

/** Accepted input image types (PRD 3. fejezet – Képformátumok). */
const ALLOWED_UPLOAD_TYPES: DetectedType[] = ['jpeg', 'png', 'heic', 'webp'];

const ALLOWED_EXTENSIONS = new Map<string, DetectedType>([
  ['jpg', 'jpeg'],
  ['jpeg', 'jpeg'],
  ['png', 'png'],
  ['heic', 'heic'],
  ['webp', 'webp'],
]);

/** Default maximum upload size: 25 MiB. */
export const DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export type FileUploadIssue =
  | 'empty'
  | 'too_large'
  | 'missing_extension'
  | 'double_extension'
  | 'disallowed_extension'
  | 'unknown_content'
  | 'disallowed_content'
  | 'mime_mismatch'
  | 'extension_content_mismatch';

export interface FileUploadInput {
  filename: string;
  /** Client-declared MIME type; treated as untrusted. */
  declaredMimeType: string;
  bytes: Buffer;
}

export interface FileValidationResult {
  valid: boolean;
  issues: FileUploadIssue[];
  /** The type detected from the file signature. */
  detectedType: DetectedType;
}

export interface FileValidationOptions {
  maxBytes?: number;
}

interface ParsedName {
  extensions: string[];
  finalExtension: string | null;
}

function parseFilename(filename: string): ParsedName {
  const base = filename.split('/').pop() ?? filename;
  const parts = base.split('.');
  // Needs a non-empty base name and at least one extension segment. A dotfile
  // like ".env" (empty base) has no usable extension.
  if (parts.length < 2 || parts[0] === '') {
    return { extensions: [], finalExtension: null };
  }
  const extensions = parts.slice(1).map((part) => part.toLowerCase());
  return {
    extensions,
    finalExtension: extensions[extensions.length - 1] ?? null,
  };
}

/**
 * Validates an uploaded file. Returns every issue found (not just the first) so
 * the UI can present precise feedback. A file is only accepted when there are
 * no issues.
 */
export function validateUpload(
  input: FileUploadInput,
  options: FileValidationOptions = {},
): FileValidationResult {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_UPLOAD_BYTES;
  const issues: FileUploadIssue[] = [];

  const detectedType = detectType(input.bytes);

  // Size / corruption.
  if (input.bytes.byteLength === 0) issues.push('empty');
  if (input.bytes.byteLength > maxBytes) issues.push('too_large');

  // Extension checks.
  const { extensions, finalExtension } = parseFilename(input.filename);
  if (finalExtension === null) {
    issues.push('missing_extension');
  } else {
    if (extensions.length > 1) issues.push('double_extension');
    const mapped = ALLOWED_EXTENSIONS.get(finalExtension);
    if (!mapped) {
      issues.push('disallowed_extension');
    } else if (detectedType !== 'unknown' && mapped !== detectedType) {
      issues.push('extension_content_mismatch');
    }
  }

  // Content checks (from the real signature).
  if (detectedType === 'unknown') {
    issues.push('unknown_content');
  } else if (!ALLOWED_UPLOAD_TYPES.includes(detectedType)) {
    issues.push('disallowed_content');
  } else {
    // Declared MIME must match the detected content when the type is known.
    const expectedMime = DETECTED_TYPE_MIME[detectedType];
    const declared = input.declaredMimeType.toLowerCase();
    if (declared && declared !== expectedMime) {
      issues.push('mime_mismatch');
    }
  }

  return { valid: issues.length === 0, issues, detectedType };
}
