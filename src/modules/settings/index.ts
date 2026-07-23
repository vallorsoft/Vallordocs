/**
 * Public API of the settings module (PRD 2. fejezet – Tenant beállítások;
 * 5. fejezet – Retention Policy; 7. fejezet – Settings).
 */
export {
  SETTINGS_LANGUAGES,
  SETTINGS_TIMEZONES,
  PDF_QUALITIES,
  tenantSettingsSchema,
  DEFAULT_TENANT_SETTINGS,
  parseTenantSettings,
  safeParseTenantSettings,
  toSettingRows,
  fromSettingRows,
  type SettingsLanguage,
  type SettingsTimezone,
  type PdfQuality,
  type TenantSettings,
  type SettingRow,
} from './settings';
