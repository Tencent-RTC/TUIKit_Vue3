interface StoredConversationDraft {
  conversationID: string;
  draft: string;
  updatedAt: number;
}

const DATABASE_NAME = 'uikit-conversation-drafts';
const STORE_NAME = 'drafts';
const DATABASE_VERSION = 1;

const memoryDrafts = new Map<string, StoredConversationDraft>();

let databasePromise: Promise<IDBDatabase | undefined> | undefined;

function canUseIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function canUseLocalStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase | undefined> {
  if (!canUseIndexedDB()) {
    return Promise.resolve(undefined);
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'conversationID' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(undefined);
      };

      request.onblocked = () => {
        resolve(undefined);
      };
    });
  }

  return databasePromise;
}

function runStoreRequest<T>(
  mode: IDBTransactionMode,
  createRequest: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | undefined> {
  return openDatabase().then(database => new Promise((resolve) => {
    if (!database) {
      resolve(undefined);
      return;
    }

    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = createRequest(store);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      resolve(undefined);
    };
  }));
}

function getLocalStorageKey(conversationID: string): string {
  return conversationID;
}

async function setLocalConversationDraft(conversationID: string, draft: string): Promise<void> {
  if (!draft) {
    await deleteLocalConversationDraft(conversationID);
    return;
  }

  const record: StoredConversationDraft = {
    conversationID,
    draft,
    updatedAt: Date.now(),
  };
  memoryDrafts.set(conversationID, record);

  const database = await openDatabase();
  if (database) {
    await runStoreRequest('readwrite', store => store.put(record));
    return;
  }

  if (canUseLocalStorage()) {
    localStorage.setItem(getLocalStorageKey(conversationID), JSON.stringify(record));
  }
}

async function getLocalConversationDraft(conversationID: string): Promise<string | undefined> {
  const database = await openDatabase();
  if (database) {
    const record = await runStoreRequest<StoredConversationDraft>('readonly', store => store.get(conversationID));
    return record?.draft;
  }

  if (canUseLocalStorage()) {
    const rawRecord = localStorage.getItem(getLocalStorageKey(conversationID));
    if (rawRecord) {
      try {
        const record = JSON.parse(rawRecord) as Partial<StoredConversationDraft>;
        return typeof record.draft === 'string' ? record.draft : undefined;
      } catch {
        return undefined;
      }
    }
  }

  return memoryDrafts.get(conversationID)?.draft;
}

async function deleteLocalConversationDraft(conversationID: string): Promise<void> {
  memoryDrafts.delete(conversationID);

  const database = await openDatabase();
  if (database) {
    await runStoreRequest('readwrite', store => store.delete(conversationID));
    return;
  }

  if (canUseLocalStorage()) {
    localStorage.removeItem(getLocalStorageKey(conversationID));
  }
}

export {
  deleteLocalConversationDraft,
  getLocalConversationDraft,
  setLocalConversationDraft,
};
