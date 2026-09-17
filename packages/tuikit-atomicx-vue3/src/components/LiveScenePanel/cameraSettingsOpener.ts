export function createCameraSettingsOpener<T>(options: {
  refreshCameraList: () => Promise<void>;
  openDialog: (source: T) => void;
}): (source: T) => Promise<void> {
  let isOpening = false;

  return async (source: T): Promise<void> => {
    if (isOpening) {
      return;
    }
    isOpening = true;
    try {
      try {
        await options.refreshCameraList();
      } catch {
        // Open the dialog so the existing unavailable-camera guidance remains visible.
      }
      options.openDialog(source);
    } finally {
      isOpening = false;
    }
  };
}
