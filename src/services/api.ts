// src/services/api.ts
import axios from 'axios';
import type { Note, AuthResponse } from '../types';

// Resolve backend base URL from Vite env in production, fallback to localhost in dev
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL
  ? String((import.meta as any).env.VITE_API_URL).replace(/\/$/, '')
  : 'http://localhost:5001';

// Construct baseURL - if API_BASE_URL already ends with /api, use it as-is, otherwise append /api
const baseURL = API_BASE_URL.endsWith('/api') 
  ? API_BASE_URL 
  : `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL,
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

// Warm-up/health-check: call this on app load to wake serverless/cold instances
export const ping = async () => {
  try {
    // If baseURL already ends with /api, /health is correct
    await api.get('/health');
  } catch (e) {
    // Ignore errors; this is best-effort warm-up
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