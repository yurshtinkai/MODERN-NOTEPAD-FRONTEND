// src/types.ts

// User data received from the API
export interface User {
  id: number; // Changed to number to match MySQL INT
  username: string;
}

// Note data from the API
export interface Note {
  _id: string; // Using _id to match your component code (NoteEditor.tsx)
  title: string;
  content: string;
  createdAt: string; // The API will provide this
  reminderDatetime?: string | null; // ISO datetime string for reminder
  reminderSent?: boolean; // Whether reminder has been sent
  isOffline?: boolean; // Flag to indicate this is an offline note
  lastModified?: number; // Timestamp for conflict resolution
}

// Data from a successful login
export interface AuthResponse {
  token: string;
  user: User;
}