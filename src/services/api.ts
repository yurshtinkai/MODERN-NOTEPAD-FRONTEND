// src/services/api.ts
import axios from 'axios';
import type { Note, AuthResponse } from '../types';

// Resolve backend base URL from Vite env in production, fallback to localhost in dev
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL
  ? String((import.meta as any).env.VITE_API_URL).replace(/\/$/, '')
  : 'http://localhost:5001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

// Function to set the auth token for all future requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// --- Auth Endpoints ---
export const registerUser = (data: any) => api.post('/auth/register', data);
export const loginUser = (data: any) => api.post<AuthResponse>('/auth/login', data);
export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.post('/auth/change-password', data);

// --- Notes Endpoints ---
export const getNotes = () => api.get<Note[]>('/notes');
export const createNote = (data: { title: string; content: string }) =>
  api.post<Note>('/notes', data);
export const updateNote = (
  id: string,
  data: { title: string; content: string }
) => api.put<Note>(`/notes/${id}`, data);
export const deleteNote = (id: string) => api.delete(`/notes/${id}`);
export const getArchivedNotes = () => api.get('/notes/archive');
export const deleteArchivedNote = (id: string) => api.delete(`/notes/archive/${id}`);

export default api;