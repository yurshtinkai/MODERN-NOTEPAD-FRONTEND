// src/components/profile/ProfileModal.tsx
import React, { useEffect, useMemo, useState } from 'react';

type NoteLike = {
  _id?: string;
  title: string;
  content: string;
  createdAt?: string | number | Date;
};

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  notes: NoteLike[];
}

function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function timeSinceDays(startMs: number): number {
  const diff = Date.now() - startMs;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userName, notes }) => {
  const [email, setEmail] = useState('user@example.com');
  const [bio, setBio] = useState('');
  const [joinDateMs, setJoinDateMs] = useState<number>(() => {
    const saved = localStorage.getItem('notepad_join_date');
    if (saved) return Number(saved);
    const now = Date.now();
    localStorage.setItem('notepad_join_date', String(now));
    return now;
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem('notepad_profile_react');
    if (savedProfile) {
      try {
        const obj = JSON.parse(savedProfile);
        if (obj.email) setEmail(obj.email);
        if (obj.bio) setBio(obj.bio);
        if (obj.joinDateMs) setJoinDateMs(obj.joinDateMs);
      } catch {}
    }
  }, []);

  const stats = useMemo(() => {
    const totalNotes = notes.length;
    const totalWords = notes.reduce((sum, n) => sum + countWords(n.content || ''), 0);
    const longestNote = totalNotes > 0 ? Math.max(...notes.map(n => countWords(n.content || ''))) : 0;
    return { totalNotes, totalWords, longestNote };
  }, [notes]);

  const avatar = userName ? userName.charAt(0).toUpperCase() : 'U';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('notepad_profile_react', JSON.stringify({ email, bio, joinDateMs }));
  };

  if (!isOpen) return null;

  return (
    <div className="profile-container" style={{ display: 'flex' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="profile-modal">
        <div className="profile-header">
          <button type="button" className="profile-close" onClick={onClose} aria-label="Close profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <div className="profile-user-info">
            <div className="profile-avatar">{avatar}</div>
            <div className="profile-details">
              <h2 className="profile-name">{userName}</h2>
              <p className="profile-role">Content Writer & Note Enthusiast</p>
              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-number">{stats.totalNotes}</div>
                  <div className="profile-stat-label">Total Notes</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-number">{stats.totalWords.toLocaleString()}</div>
                  <div className="profile-stat-label">Words Written</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-number">{timeSinceDays(joinDateMs)}</div>
                  <div className="profile-stat-label">Days Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h3 className="profile-section-title">
              <svg className="profile-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Account Settings
            </h3>
            <div className="profile-grid">
              <div className="profile-card">
                <h4 className="profile-card-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Personal Information
                </h4>
                <form onSubmit={handleSaveProfile}>
                  <div className="profile-form-group">
                    <label htmlFor="profileUsername">Username</label>
                    <input id="profileUsername" className="profile-input" value={userName} disabled />
                  </div>
                  <div className="profile-form-group">
                    <label htmlFor="profileEmail">Email Address</label>
                    <input id="profileEmail" className="profile-input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
                  </div>
                  <div className="profile-form-group">
                    <label htmlFor="profileBio">Bio</label>
                    <input id="profileBio" className="profile-input" value={bio} onChange={(e)=>setBio(e.target.value)} placeholder="Tell us about yourself..." />
                  </div>
                  <button type="submit" className="profile-btn profile-btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17,21 17,13 7,13 7,21" /><polyline points="7,3 7,8 15,8" /></svg>
                    Save Changes
                  </button>
                </form>
              </div>
              <div className="profile-card">
                <h4 className="profile-card-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><circle cx="12" cy="16" r="1" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  Change Password
                </h4>
                <form onSubmit={(e)=>{e.preventDefault();}} id="passwordFormReact">
                  <div className="profile-form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input id="currentPassword" className="profile-input" type="password" placeholder="Enter current password" />
                  </div>
                  <div className="profile-form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input id="newPassword" className="profile-input" type="password" placeholder="Enter new password" />
                  </div>
                  <div className="profile-form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input id="confirmPassword" className="profile-input" type="password" placeholder="Confirm new password" />
                  </div>
                  <button type="submit" className="profile-btn profile-btn-primary" onClick={async (e)=>{
                    e.preventDefault();
                    const current = (document.getElementById('currentPassword') as HTMLInputElement).value;
                    const next = (document.getElementById('newPassword') as HTMLInputElement).value;
                    const confirm = (document.getElementById('confirmPassword') as HTMLInputElement).value;
                    if (!current || !next || !confirm) { alert('Please fill in all fields'); return; }
                    if (next !== confirm) { alert('New passwords do not match'); return; }
                    if (next.length < 8) { alert('Password must be at least 8 characters'); return; }
                    try {
                      const mod = await import('../../services/api');
                      await mod.changePassword({ currentPassword: current, newPassword: next });
                      alert('Password updated successfully');
                      (document.getElementById('currentPassword') as HTMLInputElement).value='';
                      (document.getElementById('newPassword') as HTMLInputElement).value='';
                      (document.getElementById('confirmPassword') as HTMLInputElement).value='';
                    } catch (err: any) {
                      alert(err?.response?.data?.message || 'Failed to update password');
                    }
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><circle cx="12" cy="16" r="1" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3 className="profile-section-title">
              <svg className="profile-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              Writing Statistics
            </h3>
            <div className="profile-grid">
              <div className="profile-card">
                <h4 className="profile-card-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                  Content Overview
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center', padding: 16, background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', borderRadius: 12 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#0369a1' }}>{stats.totalNotes}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Notes</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 16, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: 12 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>{stats.totalWords.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Words</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ textAlign: 'center', padding: 16, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: 12 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>
                      {stats.totalNotes ? Math.round(stats.totalWords / stats.totalNotes) : 0}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Avg Words/Note</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 16, background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', borderRadius: 12 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#be185d' }}>{stats.longestNote}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Longest Note</div>
                  </div>
                </div>
              </div>
              <div className="profile-card">
                <h4 className="profile-card-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  Productivity Insights
                </h4>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: '#374151' }}>Writing Streak</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#4f46e5' }}>{timeSinceDays(joinDateMs)} days</span>
                  </div>
                  <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', width: '60%', borderRadius: 4 }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: '#374151' }}>Most Active Day</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#059669' }}>Monday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3 className="profile-section-title">
              <svg className="profile-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
              Recent Activity
            </h3>
            <div className="profile-activity">
              <div className="profile-activity-header">
                <h4 className="profile-activity-title">Latest Actions</h4>
              </div>
              <div className="profile-activity-list">
                <div className="profile-activity-item">
                  <div className="profile-activity-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  </div>
                  <div className="profile-activity-content">
                    <p className="profile-activity-text">No recent activity</p>
                    <p className="profile-activity-time">Start writing to see your activity here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;


