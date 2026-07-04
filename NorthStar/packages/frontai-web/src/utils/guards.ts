import { ExportFormat, Language, ThemeMode } from '@/types';

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const isExportFormat = (value: unknown): value is ExportFormat =>
  value === 'md' || value === 'txt' || value === 'csv';

export const isThemeMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'eye-care';

export const isLanguage = (value: unknown): value is Language => value === 'zh' || value === 'en';
