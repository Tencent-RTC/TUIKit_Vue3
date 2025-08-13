/**
 * 转义正则表达式中的特殊字符
 * @param string - 需要转义的字符串
 * @returns 转义后的字符串
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 转义HTML特殊字符，防止XSS攻击
 * @param text - 需要转义的文本
 * @returns 转义后的文本
 */
function sanitizeInput(text: string): string {
  if (!text || typeof text !== 'string') {
    return String(text || '');
  }
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 文本高亮工具函数
 * 用于在搜索结果中高亮显示关键词
 * @param text - 原始文本
 * @param keyword - 要高亮的关键词
 * @param className - 高亮元素的CSS类名，默认为'highlight'
 * @returns 包含高亮标记的HTML字符串
 */
export const highlightText = (
  text: string,
  keyword: string,
  className: string = 'highlight'
): string => {
  const safeText = sanitizeInput(text);
  const safeKeyword = sanitizeInput(keyword);
  
  if (!text || typeof text !== 'string') {
    return safeText;
  }
  
  if (!safeKeyword || typeof safeKeyword !== 'string') {
    return safeText;
  }

  const trimmedKeyword = safeKeyword.trim();
  if (!trimmedKeyword) {
    return safeText;
  }

  try {
    const regex = new RegExp(`(${escapeRegExp(trimmedKeyword)})`, 'gi');
    const parts = safeText.split(regex);

    if (parts.length === 1) {
      return safeText;
    }

    return parts
      .map((part, index) => {
        if (part.toLowerCase() === trimmedKeyword.toLowerCase()) {
          return `<span key="${index}" class="${className}">${part}</span>`;
        }
        return part;
      })
      .join('');
  } catch (error) {
    console.warn('Error highlighting text:', error);
    return safeText;
  }
};

export default highlightText;