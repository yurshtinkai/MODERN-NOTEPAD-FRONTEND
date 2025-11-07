// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Note } from '../types';
import * as api from '../services/api';
import { syncService } from '../services/syncService';
import { NotesSidebar } from '../components/notes/NotesSidebar';
import { NoteEditor } from '../components/notes/NoteEditor';
import { EmptyState } from '../components/notes/EmptyState';
import ProfileModal from '../components/profile/ProfileModal';

// Add pulse animation for offline indicator
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(style);

// --- SVGs for the new Header ---
const HeaderLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const SignOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
// --- End of SVGs ---

// Main Dashboard Page
const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth(); // Get user from auth
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [archived, setArchived] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingArchiveDelete, setPendingArchiveDelete] = useState<string | null>(null);
  const [isDeletingArchived, setIsDeletingArchived] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(window.innerWidth <= 768);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const nowMobile = window.innerWidth <= 768;
      setIsMobile(nowMobile);
      if (!nowMobile) {
        setIsMobileSidebarOpen(false);
      } else {
        if (!currentNoteId) {
          setIsMobileSidebarOpen(true);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentNoteId]);

  // Subscribe to online/offline status
  useEffect(() => {
    const unsubscribe = syncService.onStatusChange((online) => {
      setIsOnline(online);
      if (online) {
        // When coming back online, sync and refresh notes
        syncService.sync().then(() => {
          fetchNotes();
        });
      }
    });

    return unsubscribe;
  }, []);

  // Fetch notes (works offline too)
  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const allNotes = await syncService.getAllNotes();
      setNotes(allNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setError('Failed to fetch notes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial notes
  useEffect(() => {
    fetchNotes();
  }, []);

  // Load archived on demand
  const fetchArchived = async () => {
    try {
      const { data } = await api.getArchivedNotes();
      setArchived(data as any);
    } catch (err) {
      setError('Failed to fetch archived notes.');
    }
  };

  // Handler to create a new note
  const handleNewNote = async () => {
    try {
      if (isOnline) {
        // Online: create on server
        const { data: newNote } = await api.createNote({
          title: '',
          content: '',
        });
        setNotes([newNote, ...notes]);
        setCurrentNoteId(newNote._id);
      } else {
        // Offline: create locally
        const tempId = `offline-${Date.now()}`;
        const newNote: Note = {
          _id: tempId,
          title: '',
          content: '',
          createdAt: new Date().toISOString(),
        };
        await syncService.saveNoteOffline(newNote);
        await syncService.queueOperation('create', tempId, { title: '', content: '' });
        setNotes([newNote, ...notes]);
        setCurrentNoteId(tempId);
      }
      if (isMobile) {
        setIsMobileSidebarOpen(false);
      }
    } catch (err) {
      setError('Failed to create new note.');
    }
  };

  // Handler for selecting a note (with mobile navigation)
  const handleSelectNote = (id: string) => {
    setCurrentNoteId(id);
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  // Handler for closing editor on mobile
  const handleCloseEditor = () => {
    setCurrentNoteId(null);
    if (isMobile) {
      setIsMobileSidebarOpen(true);
    }
  };

  // Update sidebar visibility when note selection changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(!currentNoteId);
    }
  }, [currentNoteId, isMobile]);

  // Handler to delete a note
  const handleDeleteNote = async (id: string) => {
    try {
      await syncService.deleteNote(id);

      // Remove note from local state (handle both offline and resolved ids)
      const resolvedId = notes.find((note) => note._id === id)?._id || id;
      const newNotes = notes.filter((note) => note._id !== id && note._id !== resolvedId);
      setNotes(newNotes);
      if (showArchive) {
        fetchArchived();
      }
      setCurrentNoteId(null); // Go back to empty state
    } catch (err) {
      setError('Failed to delete note.');
    }
  };

  // Handler for autosaving note updates
  const handleUpdateNote = async (
    id: string,
    data: { title: string; content: string }
  ) => {
    try {
      if (isOnline) {
        // Online: update on server
        const { data: updatedNote } = await api.updateNote(id, data);
        const newNotes = notes.map((n) => (n._id === id ? updatedNote : n));
        setNotes(newNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        // Offline: save locally and queue for sync
        const currentNote = notes.find(n => n._id === id);
        if (currentNote) {
          const updatedNote: Note = {
            ...currentNote,
            ...data,
            lastModified: Date.now(),
            isOffline: true,
          };
          await syncService.saveNoteOffline(updatedNote);
          await syncService.queueOperation('update', id, data);
          
          // Update local state
          const newNotes = notes.map((n) => (n._id === id ? updatedNote : n));
          setNotes(newNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      }
    } catch (err) {
      setError('Failed to save note.');
    }
  };

  // Filter notes based on search term
  const listSource = showArchive ? archived : notes;
  const filteredNotes = listSource.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeNote = useMemo(() => {
    if (!currentNoteId) return null;
    const source = showArchive ? archived : notes;
    return source.find((note) => note._id === currentNoteId) || null;
  }, [currentNoteId, notes, archived, showArchive]);

  const pendingArchivedNote = useMemo(() => {
    if (!pendingArchiveDelete) return null;
    return archived.find((note) => note._id === pendingArchiveDelete) || null;
  }, [archived, pendingArchiveDelete]);

  // Get user details for header
  const userName = user?.username || 'User';
  const userAvatar = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Background Effects */}
      <div className="floating-shapes">
        {/* ... (shapes) ... */}
      </div>
      <div className="particles">
        {/* ... (particles) ... */}
      </div>

      <div id="appScreen" className="app-container">
        
        <div className="app-header">
          <div className="header-left">
            {isMobile && !isMobileSidebarOpen && (
              <button 
                className="mobile-menu-btn" 
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open menu"
                style={{ display: 'none' }} // <-- 1. HAMBURGER BUTTON IS HIDDEN
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
            {isMobile && currentNoteId && (
              <button 
                className="mobile-back-btn" 
                onClick={handleCloseEditor}
                aria-label="Back to notes"
                // <-- THE BACK ARROW IS STILL VISIBLE (NO HIDE STYLE)
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            <div className="header-logo">
              <HeaderLogo />
            </div>
            <h1>Modern Notepad</h1>
          </div>
          <div className="header-right">
            <div
              className="user-info"
              style={{ cursor: 'pointer' }}
              title="View profile"
              role="button"
              tabIndex={0}
              onClick={() => setIsProfileOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setIsProfileOpen(true);
              }}
            >
              <div className="user-avatar">{userAvatar}</div>
              <div className="user-details">
                <div className="user-name">{userName}</div>
                <div className="user-role">Writer</div>
              </div>
            </div>
            <button className="logout-btn" onClick={async ()=>{ setShowArchive(!showArchive); if (!showArchive) { await fetchArchived(); } }}>
              {showArchive ? 'Back to Notes' : 'View Archive'}
            </button>
            <button className="logout-btn" onClick={logout}>
              <SignOutIcon />
              {!isMobile && <span>Sign Out</span>}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error} <span onClick={() => setError('')} className="error-close">×</span>
          </div>
        )}

        <div className={`notes-container ${isMobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
          {isLoading ? (
            <div style={{ padding: '20px' }}>Loading notes...</div>
          ) : (
            <div className={`notes-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
              {isMobile && isMobileSidebarOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    padding: '16px',
                    zIndex: 101,
                  }}
                >
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      width: '36px',
                      height: '36px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#475569',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      display: 'none' // <-- 2. 'X' CLOSE BUTTON IS HIDDEN
                    }}
                    aria-label="Close sidebar"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
              <NotesSidebar
                notes={filteredNotes} 
                currentNoteId={currentNoteId}
                onNewNote={handleNewNote}
                onSelectNote={handleSelectNote}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                isArchive={showArchive}
            onDeleteArchived={(id: string) => {
              setPendingArchiveDelete(id);
            }}
              />
            </div>
          )}
          {isMobile && isMobileSidebarOpen && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 99,
              }}
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}
          <div className={`editor-container ${isMobile && currentNoteId ? 'mobile-open' : isMobile ? 'mobile-hidden' : ''}`}>
            {activeNote ? (
              <NoteEditor
                key={activeNote._id}
                note={activeNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                readOnly={showArchive}
              />
            ) : (
              (!isMobile || !isMobileSidebarOpen) && <EmptyState />
            )}
          </div>
        </div>
      </div>
      
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={userName}
        notes={notes}
        isOnline={isOnline}
      />

      {pendingArchiveDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-archive-delete-title"
            aria-describedby="confirm-archive-delete-description"
            style={{
              width: 'min(420px, 92%)',
              background: '#fff',
              borderRadius: 16,
              padding: '24px',
              boxShadow: '0 30px 60px rgba(15,23,42,0.25)',
            }}
          >
            <h3
              id="confirm-archive-delete-title"
              style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#1f2937' }}
            >
              Permanently delete note?
            </h3>
            <p
              id="confirm-archive-delete-description"
              style={{ fontSize: '14px', color: '#4b5563', marginBottom: '20px', lineHeight: 1.5 }}
            >
              This action cannot be undone. The note
              {pendingArchivedNote ? ` "${pendingArchivedNote.title || 'Untitled Note'}"` : ''} will be permanently removed from your archive.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  if (isDeletingArchived) return;
                  setPendingArchiveDelete(null);
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                disabled={isDeletingArchived}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!pendingArchiveDelete) return;
                  setIsDeletingArchived(true);
                  try {
                    await api.deleteArchivedNote(pendingArchiveDelete);
                    await fetchArchived();
                    setPendingArchiveDelete(null);
                  } catch (err) {
                    setError('Failed to permanently delete archived note.');
                  } finally {
                    setIsDeletingArchived(false);
                  }
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: isDeletingArchived ? 0.7 : 1,
                }}
                disabled={isDeletingArchived}
              >
                {isDeletingArchived ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPage;