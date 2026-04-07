import { i18next } from '@tencentcloud/uikit-base-component-vue3';

type Primitive = string | number | boolean | null;
type I18nValue = Primitive | I18nResource;
type I18nResource = Record<string, I18nValue>;

export interface I18nManifestEntry {
  key: string;
  module: string;
  default: Partial<Record<string, Primitive>>;
}

export interface I18nManifest {
  version: string;
  generatedAt: string;
  languages: string[];
  entries: I18nManifestEntry[];
}

export interface ApplyI18nOverridesResult {
  appliedKeys: string[];
  unknownKeys: string[];
  typeMismatchKeys: string[];
}

const TARGET_LANGUAGES = ['zh-CN', 'en-US'];
const registeredResources: Record<string, I18nResource> = {};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge<T extends I18nResource>(target: T, source: I18nResource, overwrite: boolean) {
  const mergedTarget = target;
  Object.entries(source).forEach(([key, value]) => {
    const targetValue = mergedTarget[key];
    if (isPlainObject(value) && isPlainObject(targetValue)) {
      deepMerge(targetValue as I18nResource, value as I18nResource, overwrite);
      return;
    }
    if (targetValue === undefined || overwrite) {
      mergedTarget[key] = value as I18nValue;
    }
  });
  return mergedTarget;
}

function flattenResource(
  resource: I18nResource,
  prefix = '',
  output: Record<string, Primitive> = {},
) {
  const flattenedOutput = output;
  Object.entries(resource).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value)) {
      flattenResource(value as I18nResource, fullKey, flattenedOutput);
      return;
    }
    if (
      value === null
      || typeof value === 'string'
      || typeof value === 'number'
      || typeof value === 'boolean'
    ) {
      flattenedOutput[fullKey] = value;
    }
  });
  return flattenedOutput;
}

function buildManifestFromResourceMap(
  resourceMap: Record<string, I18nResource>,
  version = 'runtime',
): I18nManifest {
  const perLanguageFlatMap: Record<string, Record<string, Primitive>> = {};
  const allKeys = new Set<string>();

  Object.entries(resourceMap).forEach(([language, resource]) => {
    const flatResource = flattenResource(resource);
    perLanguageFlatMap[language] = flatResource;
    Object.keys(flatResource).forEach(key => allKeys.add(key));
  });

  const entries = Array.from(allKeys)
    .sort()
    .map((key): I18nManifestEntry => {
      const entryDefault: Partial<Record<string, Primitive>> = {};
      Object.entries(perLanguageFlatMap).forEach(([language, flatResource]) => {
        const value = flatResource[key];
        if (value !== undefined) {
          entryDefault[language] = value;
        }
      });
      const keySegments = key.split('.');
      const moduleName = keySegments.length > 1 ? keySegments[0] : 'global';
      return {
        key,
        module: moduleName,
        default: entryDefault,
      };
    });

  return {
    version,
    generatedAt: new Date().toISOString(),
    languages: [...TARGET_LANGUAGES],
    entries,
  };
}

export const addI18n = (
  lng: string,
  resource: { translation: I18nResource },
  deep = true,
  overwrite = false,
) => {
  i18next.addResourceBundle(lng, 'translation', resource.translation, deep, overwrite);
  const existing = registeredResources[lng] || {};
  registeredResources[lng] = deepMerge(existing, resource.translation, overwrite);
};

export const setLanguage = async (lng: string) => {
  await i18next.changeLanguage(lng);
};

export const applyI18nOverrides = (
  lng: string,
  overrides: I18nResource,
  options: { warn?: boolean } = {},
): ApplyI18nOverridesResult => {
  const warnEnabled = options.warn !== false;
  const baseFlatResource = flattenResource(registeredResources[lng] || {});
  const overrideFlatResource = flattenResource(overrides || {});
  const unknownKeys: string[] = [];
  const typeMismatchKeys: string[] = [];

  Object.entries(overrideFlatResource).forEach(([key, value]) => {
    const baseValue = baseFlatResource[key];
    if (baseValue === undefined) {
      unknownKeys.push(key);
      return;
    }
    if (typeof baseValue !== typeof value) {
      typeMismatchKeys.push(key);
    }
  });

  const i18nLogger = i18next.services?.logger;
  if (warnEnabled && unknownKeys.length && i18nLogger?.warn) {
    i18nLogger.warn('[i18n] unknown override keys:', unknownKeys.join(', '));
  }
  if (warnEnabled && typeMismatchKeys.length && i18nLogger?.warn) {
    i18nLogger.warn('[i18n] type mismatch override keys:', typeMismatchKeys.join(', '));
  }

  addI18n(lng, { translation: overrides }, true, true);

  return {
    appliedKeys: Object.keys(overrideFlatResource),
    unknownKeys,
    typeMismatchKeys,
  };
};

export const getI18nManifest = (): I18nManifest => buildManifestFromResourceMap(registeredResources);
