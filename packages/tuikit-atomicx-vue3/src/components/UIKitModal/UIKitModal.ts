import { createApp } from 'vue';
import { useUIKitModalState } from '../../states/UIKitModalState';
import UIKitModalComponent from './index.vue';
import type { UIKitModalOptions } from './type';

let instance: any = null;

const { openModal: openModalState, closeModal } = useUIKitModalState();

const isLocalEnvironment = (): boolean => {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
};

const cleanup = () => {
  if (instance) {
    instance.unmount();
    instance = null;
  }
};

const createUIKitModal = (options: UIKitModalOptions): Promise<{ action: string }> => new Promise((resolve) => {
  cleanup();

  openModalState({
    id: options.id,
    title: options.title,
    content: options.content,
    type: options.type,
    onConfirm: options.onConfirm,
    onCancel: options.onCancel,
  });

  if (!isLocalEnvironment()) {
    resolve({ action: 'confirm' });
    return;
  }

  const handleAction = (action: 'confirm' | 'cancel') => {
    closeModal(action);
    cleanup();
    resolve({ action });
  };

  const props = {
    ...options,
    visible: true,
    onConfirm: () => {
      options.onConfirm?.();
      handleAction('confirm');
    },
    onCancel: () => {
      options.onCancel?.();
      handleAction('cancel');
    },
  };

  instance = createApp(UIKitModalComponent, props);
  instance.mount(document.createElement('div'));
});

export const UIKitModal = {
  openModal: (config: UIKitModalOptions) => createUIKitModal(config),
};
