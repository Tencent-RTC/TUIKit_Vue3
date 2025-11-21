/**
 * trims and escapes a string for use in a regular expression
 * @param string - string to trim and escape
 * @returns string with trimmed and escaped characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param text - string to escape
 * @returns escaped string
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
 * Highlights a keyword in a given text
 * @param text - text to highlight
 * @param keyword - keyword to highlight
 * @param className - CSS class name for the highlight, default is 'highlight'
 * @returns HTML string with highlighted text
 */
export const highlightText = (
  text: string,
  keyword: string,
  className = 'highlight',
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
