// src/services/offlineStorage.ts
// IndexedDB service for offline note storage

const DB_NAME = 'ModernNotepadDB';
const DB_VERSION = 1;
const STORE_NAME = 'notes';
const SYNC_QUEUE_STORE = 'syncQueue';

interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  reminderDatetime?: string | null;
  reminderSent?: boolean;
  isOffline?: boolean; // Flag to indicate this is an offline note
  lastModified?: number; // Timestamp for conflict resolution
}

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  noteId: string;
  data?: any;
  timestamp: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create notes store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const notesStore = db.createObjectStore(STORE_NAME, { keyPath: '_id' });
          notesStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Save note offline
  async saveNote(note: Note): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const noteWithTimestamp = {
        ...note,
        isOffline: true,
        lastModified: Date.now(),
      };

      const request = store.put(noteWithTimestamp);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Bulk save notes (used when online to refresh local cache)
  async saveNotes(notes: Note[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Clear existing notes before inserting fresh copies
      store.clear();

      notes.forEach((note) => {
        const lastModified = note.lastModified
          ? Number(note.lastModified)
          : note.createdAt
          ? new Date(note.createdAt).getTime()
          : Date.now();

        store.put({
          ...note,
          isOffline: false,
          lastModified,
        });
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get all notes from offline storage
  async getAllNotes(): Promise<Note[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get a single note
  async getNote(id: string): Promise<Note | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Delete note from offline storage
  async deleteNote(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Add operation to sync queue
  async addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      
      const syncOp: SyncOperation = {
        ...operation,
        id: `${operation.type}-${operation.noteId}-${Date.now()}`,
        timestamp: Date.now(),
      };

      const request = store.add(syncOp);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending sync operations
  async getSyncQueue(): Promise<SyncOperation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Remove operation from sync queue
  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all offline data
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME, SYNC_QUEUE_STORE], 'readwrite');
      
      transaction.objectStore(STORE_NAME).clear();
      transaction.objectStore(SYNC_QUEUE_STORE).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();

