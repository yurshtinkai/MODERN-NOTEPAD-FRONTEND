// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Note } from '../types';
import * as api from '../services/api';
import { NotesSidebar } from '../components/notes/NotesSidebar';
import { NoteEditor } from '../components/notes/NoteEditor';
import { EmptyState } from '../components/notes/EmptyState';
import ProfileModal from '../components/profile/ProfileModal';
// We deleted Dashboard.css, so remove this import
// import '../styles/Dashboard.css';

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
  // Mobile navigation state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch initial notes from API
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.getNotes();
        setNotes(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err) {
        setError('Failed to fetch notes.');
      } finally {
        setIsLoading(false);
      }
    };
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
      const { data: newNote } = await api.createNote({
        title: '',
        content: '',
      });
      setNotes([newNote, ...notes]);
      setCurrentNoteId(newNote._id);
      // On mobile, close sidebar and show editor
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
    // On mobile, close sidebar after selecting note
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  // Handler for closing editor on mobile
  const handleCloseEditor = () => {
    setCurrentNoteId(null);
  };

  // Handler to delete a note
  const handleDeleteNote = async (id: string) => {
    try {
      await api.deleteNote(id);
      setNotes(notes.filter((note) => note._id !== id));
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
      const { data: updatedNote } = await api.updateNote(id, data);
      
      // Update the note in the local state
      const newNotes = notes.map((n) => (n._id === id ? updatedNote : n));
      
      // Re-sort list to bring updated note to top
      setNotes(newNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

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

  const activeNote = (showArchive ? archived : notes).find((note) => note._id === currentNoteId);

  // Get user details for header
  const userName = user?.username || 'User';
  const userAvatar = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Background Effects */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
        <div className="shape shape-6"></div>
      </div>
      <div className="particles">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      {/* Main App - NO .container wrapper, .app-container is full-screen */}
      <div id="appScreen" className="app-container">
        
        {/* New Header from index.html */}
        <div className="app-header">
          <div className="header-left">
            {/* Mobile Menu Button */}
            {isMobile && !currentNoteId && (
              <button 
                className="mobile-menu-btn" 
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
            {/* Mobile Back Button */}
            {isMobile && currentNoteId && (
              <button 
                className="mobile-back-btn" 
                onClick={handleCloseEditor}
                aria-label="Back to notes"
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
            <div className="user-info">
              <div className="user-avatar">{userAvatar}</div>
              <div className="user-details">
                <div className="user-name">{userName}</div>
                <div className="user-role" style={{ cursor: 'pointer' }} onClick={() => setIsProfileOpen(true)}>Writer</div>
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
        {/* End of New Header */}

        {/* Error display */}
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
              {/* Mobile sidebar close button */}
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#475569',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
                notes={filteredNotes} // Pass filtered notes
                currentNoteId={currentNoteId}
                onNewNote={handleNewNote}
                onSelectNote={handleSelectNote}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                isArchive={showArchive}
                onDeleteArchived={async (id: string) => {
                  const confirmDelete = window.confirm('Are you sure you want to permanently delete this note?');
                  if (!confirmDelete) return;
                  try {
                    await api.deleteArchivedNote(id);
                    await fetchArchived();
                  } catch (err) {
                    setError('Failed to permanently delete archived note.');
                  }
                }}
              />
            </div>
          )}
          {/* Click backdrop to close sidebar */}
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
          <div className={`editor-container ${isMobile && currentNoteId ? 'mobile-open' : ''}`}>
            {activeNote ? (
              <NoteEditor
                key={activeNote._id} // Force re-render when note changes
                note={activeNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                readOnly={showArchive}
              />
            ) : (
              !isMobile && <EmptyState />
            )}
          </div>
        </div>
      </div>
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={userName}
        notes={notes}
      />
    </>
  );
};

export default DashboardPage;