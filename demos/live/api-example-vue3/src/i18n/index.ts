import { addI18n } from 'tuikit-atomicx-vue3';
import { i18next } from '@tencentcloud/uikit-base-component-vue3';
import { resource as enResource } from './en-US';
import { resource as zhResource } from './zh-CN';
import { getSavedLocale, saveLocale } from './localeStorage';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

export { getSavedLocale, saveLocale };

/**
 * Re-apply the persisted locale during boot. Must run AFTER the demo
 * resources are registered (above) and is awaited in `main.ts` BEFORE the
 * app mounts, so the first render already uses the saved language.
 * Safe to call when nothing was saved — it then leaves the default intact.
 */
export async function restoreLocale(): Promise<void> {
  const saved = getSavedLocale();
  if (!saved || saved === i18next.language) {
    return;
  }
  await i18next.changeLanguage(saved);
}
