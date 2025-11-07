// src/services/syncService.ts
// Service to handle online/offline sync

import { offlineStorage } from './offlineStorage';
import * as api from './api';
import type { Note } from '../types';

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  noteId: string;
  data?: any;
  timestamp: number;
}

class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private listeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    // Initialize offline storage
    offlineStorage.init().catch(console.error);

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
      this.sync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
    });

    // Initial sync check
    if (this.isOnline) {
      setTimeout(() => this.sync(), 2000); // Wait 2 seconds after page load
    }
  }

  // Subscribe to online/offline status changes
  onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);
    // Immediately call with current status
    callback(this.isOnline);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(callback => callback(isOnline));
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Sync offline changes to server
  async sync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      const queue = await offlineStorage.getSyncQueue();
      
      if (queue.length === 0) {
        this.syncInProgress = false;
        return;
      }

      console.log(`Syncing ${queue.length} pending operations...`);

      // Process operations in order
      for (const operation of queue) {
        try {
          await this.processOperation(operation);
          await offlineStorage.removeFromSyncQueue(operation.id);
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          // If it's a network error, stop syncing and wait for next online event
          if (error && typeof error === 'object' && 'code' in error && 
              (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED')) {
            this.isOnline = false;
            this.notifyListeners(false);
            break;
          }
        }
      }

      // After syncing operations, sync notes
      await this.syncNotes();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'create':
        if (operation.data) {
          await api.createNote(operation.data);
        }
        break;
      case 'update':
        await api.updateNote(operation.noteId, operation.data || {});
        break;
      case 'delete':
        await api.deleteNote(operation.noteId);
        break;
    }
  }

  // Sync notes: merge offline and online notes
  private async syncNotes(): Promise<void> {
    try {
      // Get offline notes
      const offlineNotes = await offlineStorage.getAllNotes();
      
      // Get online notes
      const { data: onlineNotes } = await api.getNotes();

      // Update offline cache with latest online notes
      await offlineStorage.saveNotes(onlineNotes);

      // Create a map of online notes by ID
      const onlineNotesMap = new Map(onlineNotes.map(note => [note._id, note]));

      // For each offline note, check if it needs to be synced
      for (const offlineNote of offlineNotes) {
        const onlineNote = onlineNotesMap.get(offlineNote._id);

        if (!onlineNote) {
          // Note doesn't exist online, create it
          try {
            await api.createNote({
              title: offlineNote.title,
              content: offlineNote.content,
              reminderDatetime: offlineNote.reminderDatetime,
            });
            // Remove from offline storage after successful sync
            await offlineStorage.deleteNote(offlineNote._id);
          } catch (error) {
            console.error('Failed to sync offline note:', error);
          }
        } else {
          // Note exists, check if offline version is newer
          const offlineTime = offlineNote.lastModified || 0;
          const onlineTime = new Date(onlineNote.createdAt).getTime();

          if (offlineTime > onlineTime) {
            // Offline version is newer, update online
            try {
              await api.updateNote(offlineNote._id, {
                title: offlineNote.title,
                content: offlineNote.content,
                reminderDatetime: offlineNote.reminderDatetime,
              });
              // Remove from offline storage after successful sync
              await offlineStorage.deleteNote(offlineNote._id);
            } catch (error) {
              console.error('Failed to sync offline note update:', error);
            }
          } else {
            // Online version is newer or same, remove offline copy
            await offlineStorage.deleteNote(offlineNote._id);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing notes:', error);
    }
  }

  // Queue an operation for later sync
  async queueOperation(
    type: 'create' | 'update' | 'delete',
    noteId: string,
    data?: any
  ): Promise<void> {
    await offlineStorage.addToSyncQueue({ type, noteId, data });
  }

  // Save note offline
  async saveNoteOffline(note: Note): Promise<void> {
    await offlineStorage.saveNote(note);
  }

  // Get all notes (offline + online)
  async getAllNotes(): Promise<Note[]> {
    const offlineNotes = await offlineStorage.getAllNotes();
    
    if (this.isOnline) {
      try {
        const { data: onlineNotes } = await api.getNotes();
        
        // Cache online notes for offline usage
        await offlineStorage.saveNotes(onlineNotes);
        try {
          localStorage.setItem('notepad_cached_notes', JSON.stringify(onlineNotes));
        } catch (error) {
          console.warn('Failed to cache notes in localStorage', error);
        }

        // Merge offline and online notes
        const notesMap = new Map<string, Note>();
        
        // Add online notes first
        onlineNotes.forEach(note => notesMap.set(note._id, note));
        
        // Add offline notes (they will override if same ID, which is fine)
        offlineNotes.forEach(note => {
          if (!notesMap.has(note._id)) {
            notesMap.set(note._id, note);
          }
        });
        
        return Array.from(notesMap.values());
      } catch (error) {
        // If online fetch fails, return offline notes
        console.error('Failed to fetch online notes, using offline:', error);
        return offlineNotes;
      }
    }
    
    if (offlineNotes.length > 0) {
      return offlineNotes;
    }

    try {
      const cached = localStorage.getItem('notepad_cached_notes');
      if (cached) {
        const parsed = JSON.parse(cached) as Note[];
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load cached notes from localStorage', error);
    }

    return offlineNotes;
  }
}

export const syncService = new SyncService();

