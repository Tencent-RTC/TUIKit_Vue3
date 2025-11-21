/**
 * safe JSON parse function
 * @param text JSON string
 * @param defaultValue default value when parse failed
 * @param reviver JSON.parse reviver function
 * demo:
 * const data = safeJSONParse('{"name": "test"}', {});
 * const array = safeJSONParse('[1,2,3]', []);
 * const num = safeJSONParse('123', 0);
 * const invalidJson = safeJSONParse('invalid json', { fallback: true });
 */
function safeJSONParse<T>(
  text: string,
  defaultValue: T,
  reviver?: (key: string, value: any) => any,
): T {
  if (!text) {
    return defaultValue;
  }

  try {
    // resolve some usual errors
    const trimmed = text.trim();
    if (!trimmed) {
      return defaultValue;
    }
    if (trimmed === 'undefined') {
      return defaultValue;
    }
    if (trimmed === 'null') {
      return null as T;
    }

    const parsed = JSON.parse(trimmed, reviver);

    // verify parsed value
    if (parsed === undefined || parsed === null) {
      return defaultValue;
    }

    return parsed;
  } catch (error) {
    console.warn('JSON parse failed:', error);
    return defaultValue;
  }
}

export {
  safeJSONParse,
};
