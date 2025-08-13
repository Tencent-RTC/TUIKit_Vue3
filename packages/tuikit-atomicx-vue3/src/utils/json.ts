// Determine if it is a JSON string
function isJSON(str: string) {
  if (typeof str === 'string') {
    try {
      const data = JSON.parse(str);
      if (data) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  return false;
}

// Determine if it is a JSON string
export function JSONStringToParse(str: string) {
  if (!isJSON(str)) {
    return str;
  }
  return JSON.parse(str);
}

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
export function safeJSONParse<T>(
  text: string,
  defaultValue: T,
  reviver?: (key: string, value: any) => any,
): T {
  if (!text) {
    return defaultValue;
  }

  try {
    // 处理一些常见的错误输入
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

    // 尝试解析 JSON
    const parsed = JSON.parse(trimmed, reviver);

    // 验证解析结果是否为有效值
    if (parsed === undefined || parsed === null) {
      return defaultValue;
    }

    return parsed;
  } catch (error) {
    console.warn('JSON parse failed:', error);
    return defaultValue;
  }
}

/**
 * safe JSON stringify function
 * @param value value to stringify
 * @param replacer JSON.stringify replacer function
 * @param space JSON.stringify space parameter
 * @returns JSON string or empty string when stringify failed
 */
export function safeJSONStringify(
  value: any,
  replacer?: (key: string, value: any) => any,
  space?: string | number,
): string {
  try {
    if (value === undefined || value === null) {
      return '';
    }
    return JSON.stringify(value, replacer, space);
  } catch (error) {
    console.warn('JSON stringify failed:', error);
    return '';
  }
}

/**
 * deep clone object using JSON
 * @param obj object to clone
 * @returns cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  return safeJSONParse(safeJSONStringify(obj), obj);
}

export default {
  JSONStringToParse,
  safeJSONParse,
  safeJSONStringify,
  deepClone,
};
