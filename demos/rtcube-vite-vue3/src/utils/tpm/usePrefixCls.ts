import { MAT_CLASS_PREFIX } from './config';

/**
 * Generate prefixed class name for components
 * @param suffixCls - Component suffix class name
 * @param prefix - Custom prefix (optional)
 * @param matPrefix - Material prefix (optional)
 */
export const usePrefixCls = (
  suffixCls = '',
  prefix = '',
  matPrefix = MAT_CLASS_PREFIX
): string => {
  const prefixCls = prefix || matPrefix;
  return suffixCls ? `${prefixCls}-${suffixCls}` : prefixCls;
};
