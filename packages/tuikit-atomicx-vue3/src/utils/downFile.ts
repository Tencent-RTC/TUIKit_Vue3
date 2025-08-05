function downFile(url: string, fileName?: string) {
  const options = {
    mode: 'cors',
    headers: new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }),
  } as RequestInit;

  let _fileName = fileName;
  if (!fileName) {
    _fileName = Math.random().toString(36).substring(7);
  }
  // If the browser supports fetch, use blob to download, so as to avoid the browser clicking the a tag and jumping to the preview of the new page
  if (typeof window.fetch === 'function') {
    fetch(url, options)
      .then(res => res.blob())
      .then((blob) => {
        const a = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = _fileName || 'file';
        a.click();
      });
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = _fileName || 'file';
    a.click();
  }
}

export {
  downFile,
};
