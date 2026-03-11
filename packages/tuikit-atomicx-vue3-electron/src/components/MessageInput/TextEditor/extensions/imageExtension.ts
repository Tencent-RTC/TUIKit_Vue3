import Image from '@tiptap/extension-image';
import { Plugin, PluginKey } from '@tiptap/pm/state';

function createImageExtension() {
  return Image.extend({
    addOptions() {
      return {
        ...this.parent?.(),
        HTMLAttributes: {
          class: 'message-image',
        },
      };
    },
    addAttributes() {
      return {
        ...this.parent?.(),
        fileData: {
          default: null,
          parseHTML: () => null,
          renderHTML: () => ({}),
        },
      };
    },
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('imagePaste'),
          props: {
            handlePaste: (view, event) => {
              const items = Array.from(event.clipboardData?.items || []);
              const images = items.filter(item => item.type.indexOf('image') === 0);

              if (images.length === 0) {
                return false; // Let default handler process
              }

              images.forEach((item) => {
                const file = item.getAsFile();

                if (file) {
                  const reader = new FileReader();
                  reader.onload = (readerEvent) => {
                    const dataUrl = readerEvent.target?.result as string;

                    const node = view.state.schema.nodes.image.create({
                      src: dataUrl,
                      fileData: file,
                    });

                    const transaction = view.state.tr.replaceSelectionWith(node);
                    view.dispatch(transaction);
                  };

                  reader.onerror = (error) => {
                    console.error('[MessageInput]::Failed to read image file:', error);
                  };

                  reader.onabort = () => {
                    console.warn('[MessageInput]::Image file reading was aborted.');
                  };

                  reader.readAsDataURL(file);
                }
              });

              return true; // Prevent default paste behavior
            },
          },
        }),
      ];
    },
  }).configure({
    inline: true,
  });
}

export {
  createImageExtension,
};
