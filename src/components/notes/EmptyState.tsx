// src/components/notes/EmptyState.tsx
import React from 'react';

const EmptyStateIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

export const EmptyState: React.FC = () => {
  return (
    <div id="emptyState" className="empty-state">
      <div className="empty-state-icon">
        <EmptyStateIcon />
      </div>
      <h3>Welcome to your notepad</h3>
      <p>Create a new note or select one to get started</p>
    </div>
  );
};