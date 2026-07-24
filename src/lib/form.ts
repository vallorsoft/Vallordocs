import { ApiError } from '@/lib/api/client';

/**
 * Form helpers shared by the admin create/edit dialogs (PRD 4. fejezet –
 * Űrlapok). Kept tiny and pure so the pages stay declarative.
 */

/** Trims string values and drops empty ones, yielding a compact JSON payload. */
export function compactStrings(
  record: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value !== ''),
  );
}

/**
 * Resolves the first translation key to show for a failed mutation: a field-level
 * validation issue when present, otherwise the top-level error key, falling back
 * to the generic message. The caller passes `hasKey` (next-intl's `t.has`) so the
 * fallback is honoured without importing the translator here.
 */
export function errorMessageKey(
  error: unknown,
  hasKey: (key: string) => boolean,
): string {
  if (error instanceof ApiError) {
    const key = error.issues?.[0]?.messageKey ?? error.messageKey;
    if (hasKey(key)) return key;
  }
  return 'errors.generic';
}
