// src/components/notes/NoteEditor.tsx
import React, { useState, useEffect } from 'react';
import type { Note } from '../../types';

interface NoteEditorProps {
  note: Note;
  onUpdateNote: (id: string, data: { title: string; content: string }) => void;
  onDeleteNote: (id: string) => void;
  readOnly?: boolean;
}

// --- SVGs for Editor ---
const ExportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6" />
    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const WordCountIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);
// --- End of SVGs ---

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onUpdateNote,
  onDeleteNote,
  readOnly = false,
}) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [lastSaved, setLastSaved] = useState('Never');

  // Update local state when the selected note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setLastSaved(new Date(note.createdAt).toLocaleTimeString());
  }, [note]);

  // Autosave logic
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!readOnly && (title !== note.title || content !== note.content)) {
        onUpdateNote(note._id, { title, content });
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 500); // Autosave after 500ms of inactivity

    return () => {
      clearTimeout(handler);
    };
  }, [title, content, note, onUpdateNote]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Export as Markdown
  const handleExport = () => {
    const mdContent = `# ${title || 'Untitled Note'}\n\n${content}`;
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'Untitled Note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="editor-header">
        <div className="editor-title-section">
          <input
            type="text"
            className="note-title-input"
            placeholder="Untitled Note"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={readOnly}
          />
          <div className="editor-meta">
            <div className="word-count">
              <WordCountIcon />
              <span>{wordCount} words</span>
            </div>
            <div className="last-saved">
              <ClockIcon />
              <span>{lastSaved}</span>
            </div>
          </div>
        </div>
        <div className="editor-actions">
          <button className="action-btn export-btn" onClick={handleExport}>
            <ExportIcon />
            Export
          </button>
          {!readOnly && (
          <button
            className="action-btn delete-note-btn"
            onClick={() => onDeleteNote(note._id)}
          >
            <DeleteIcon />
            Delete
          </button>
          )}
        </div>
      </div>
      <div className="editor">
        <textarea
          className="note-content"
          placeholder="Start writing your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={readOnly}
        ></textarea>
      </div>
    </div>
  );
};