async function copyTextToClipboard(text: string): Promise<boolean> {
  // Try Clipboard API first
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed:', err);
    }
  }

  // Fallback 1: execCommand (PC)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Prevent scrolling
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    // Special handling for iOS
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      textarea.contentEditable = 'true';
      textarea.readOnly = false;

      const range = document.createRange();
      range.selectNodeContents(textarea);

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        textarea.setSelectionRange(0, 999999);
      }
    } else {
      textarea.select();
    }

    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    return result;
  } catch (err) {
    console.warn('execCommand failed:', err);
  }

  // Fallback 2: Prompt user to copy manually
  throw new Error('Failed to copy text to clipboard, please copy manually');
}

export {
  copyTextToClipboard,
};
