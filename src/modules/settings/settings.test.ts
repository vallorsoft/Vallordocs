import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TENANT_SETTINGS,
  fromSettingRows,
  parseTenantSettings,
  safeParseTenantSettings,
  toSettingRows,
} from './settings';

describe('DEFAULT_TENANT_SETTINGS', () => {
  it('has the documented safe defaults', () => {
    expect(DEFAULT_TENANT_SETTINGS).toEqual({
      defaultLanguage: 'hu',
      defaultTimezone: 'Europe/Budapest',
      aiEnabled: true,
      pdfQuality: 'high',
      documentRetentionDays: 3650,
      auditRetentionDays: 3650,
      logRetentionDays: 365,
    });
    expect(DEFAULT_TENANT_SETTINGS.storageLimitMb).toBeUndefined();
  });
});

describe('parseTenantSettings', () => {
  it('merges partial input with defaults', () => {
    const s = parseTenantSettings({ defaultLanguage: 'ro', aiEnabled: false });
    expect(s.defaultLanguage).toBe('ro');
    expect(s.aiEnabled).toBe(false);
    expect(s.pdfQuality).toBe('high');
    expect(s.documentRetentionDays).toBe(3650);
  });

  it('accepts empty/undefined input and returns defaults', () => {
    expect(parseTenantSettings(undefined)).toEqual(DEFAULT_TENANT_SETTINGS);
    expect(parseTenantSettings({})).toEqual(DEFAULT_TENANT_SETTINGS);
  });

  it('rejects invalid enum values', () => {
    expect(safeParseTenantSettings({ defaultLanguage: 'de' }).success).toBe(
      false,
    );
    expect(safeParseTenantSettings({ pdfQuality: 'ultra' }).success).toBe(
      false,
    );
  });

  it('rejects retention days below 1 and non-integers', () => {
    expect(safeParseTenantSettings({ documentRetentionDays: 0 }).success).toBe(
      false,
    );
    expect(safeParseTenantSettings({ auditRetentionDays: 1.5 }).success).toBe(
      false,
    );
    expect(safeParseTenantSettings({ logRetentionDays: -5 }).success).toBe(
      false,
    );
  });

  it('rejects non-positive storageLimitMb', () => {
    expect(safeParseTenantSettings({ storageLimitMb: 0 }).success).toBe(false);
    expect(safeParseTenantSettings({ storageLimitMb: 512 }).success).toBe(true);
  });
});

describe('toSettingRows / fromSettingRows', () => {
  it('round-trips a settings object', () => {
    const settings = parseTenantSettings({
      defaultLanguage: 'ro',
      storageLimitMb: 1024,
      logRetentionDays: 90,
    });
    const rows = toSettingRows(settings);
    expect(fromSettingRows(rows)).toEqual(settings);
  });

  it('omits absent optional fields from rows', () => {
    const rows = toSettingRows(DEFAULT_TENANT_SETTINGS);
    expect(rows.find((r) => r.key === 'storageLimitMb')).toBeUndefined();
    expect(rows.find((r) => r.key === 'defaultLanguage')?.value).toBe('hu');
  });

  it('ignores unknown keys and fills missing keys with defaults', () => {
    const settings = fromSettingRows([
      { key: 'defaultLanguage', value: 'ro' },
      { key: 'unknownKey', value: 'x' },
    ]);
    expect(settings.defaultLanguage).toBe('ro');
    expect(settings.pdfQuality).toBe('high');
    expect(settings).not.toHaveProperty('unknownKey');
  });

  it('throws when a known key holds an invalid value', () => {
    expect(() =>
      fromSettingRows([{ key: 'documentRetentionDays', value: 0 }]),
    ).toThrow();
  });
});
