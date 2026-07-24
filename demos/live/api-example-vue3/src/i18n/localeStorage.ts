// Locale persistence helpers with NO SDK dependencies.
//
// Kept separate from `./index.ts` on purpose: `index.ts` registers demo
// i18n resources via `addI18n` (which touches the SDK instance). Importing
// `./index.ts` before the SDK is loaded would crash, but `main.ts` and the
// boot overlay both need to READ the saved locale as early as possible
// (before the app — and its i18n resources — are ready). This module is
// pure and safe to import at any point.

const LOCALE_STORAGE_KEY = 'api-example.locale';
const SUPPORTED_LOCALES = ['en-US', 'zh-CN'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: string | null): value is SupportedLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Persist the chosen locale. No-ops if storage is unavailable. */
export function saveLocale(locale: string): void {
  if (!isSupportedLocale(locale)) {
    return;
  }
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* storage may be denied (privacy mode / quota) — non-fatal */
  }
}

/** Read the persisted locale, or null when absent / unsupported / storage-denied. */
export function getSavedLocale(): SupportedLocale | null {
  let saved: string | null = null;
  try {
    saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
  return isSupportedLocale(saved) ? saved : null;
}
