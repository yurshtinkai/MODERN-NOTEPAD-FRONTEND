// src/components/notes/NotesSidebar.tsx
import React from 'react';
import type { Note } from '../../types';
import { formatDate } from '../../utils/formatDate';

interface NotesSidebarProps {
  notes: Note[];
  currentNoteId: string | null;
  onNewNote: () => void;
  onSelectNote: (id: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isArchive?: boolean;
  onDeleteArchived?: (id: string) => void;
}

// --- SVGs for Sidebar ---
const NewNoteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SearchIcon = () => (
  <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const NoteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
// --- End of SVGs ---

// Helper to count words
const countWords = (text: string) => {
  if (!text || text.trim() === '') return 0;
  return text.trim().split(/\s+/).length;
};

export const NotesSidebar: React.FC<NotesSidebarProps> = ({
  notes,
  currentNoteId,
  onNewNote,
  onSelectNote,
  searchTerm,
  onSearchChange,
  isArchive = false,
  onDeleteArchived,
}) => {
  // Calculate total word count across all notes (using the passed 'notes' prop)
  const totalWords = notes.reduce((total, note) => {
    return total + countWords(note.content);
  }, 0);

  return (
    <div className="notes-sidebar">
      <div className="sidebar-header">
        
        {/* Stats from index.html */}
        <div className="sidebar-stats">
          <div className="stat-item">
            <div className="stat-number">{notes.length}</div>
            <div className="stat-label">Notes</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{totalWords}</div>
            <div className="stat-label">Words</div>
          </div>
        </div>

        {/* Search Box from index.html */}
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <SearchIcon />
        </div>
        
        {/* New Note Button (hidden in Archive view) */}
        {!isArchive && (
          <button className="new-note-btn" onClick={onNewNote}>
            <NewNoteIcon /> New Note
          </button>
        )}
      </div>
      
      <div className="notes-list" id="notesList">
        {notes.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            {searchTerm ? 'No notes found' : 'No notes yet'}
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className={`note-item ${
                note._id === currentNoteId ? 'active' : ''
              }`}
              onClick={() => onSelectNote(note._id)}
            >
              <div className="note-icon">
                <NoteIcon />
              </div>
              <div className="note-content-wrapper">
                <div className="note-title">{note.title || 'Untitled Note'}</div>
                <div className="note-preview">
                  {note.content?.substring(0, 80) || 'No content'}
                </div>
                {/* Updated date format from index.html */}
                <div className="note-date">
                  {formatDate(note.createdAt)} • {countWords(note.content)} words
                </div>
              </div>
              {isArchive && (
                <button
                  aria-label="Delete permanently"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteArchived) onDeleteArchived(note._id);
                  }}
                  style={{
                    marginLeft: '8px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};