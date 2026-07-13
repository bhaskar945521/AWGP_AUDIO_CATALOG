import React, { useEffect, useState, useRef } from 'react';
import api, { resolveUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

/* ── Listening history item ─────────────────────── */
function HistoryItem({ session, onPlay }) {
  const audio = session.audioId;
  if (!audio) return null;
  const image = audio.imageUrl ? resolveUrl(audio.imageUrl) : null;
  const minutes = session.durationListened ? Math.floor(session.durationListened / 60) : null;
  const seconds = session.durationListened ? session.durationListened % 60 : null;

  return (
    <div
      onClick={() => onPlay(audio)}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 16px', borderRadius: '14px',
        background: 'var(--card-bg, rgba(255,255,255,0.03))',
        border: '1.5px solid var(--border)', cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: '10px', flexShrink: 0,
        background: 'var(--border)', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {image
          ? <img src={image} alt={audio.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <i className="fas fa-music" style={{ color: 'var(--saffron)', fontSize: '1.1rem' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {audio.title}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {audio.speaker || 'Unknown Speaker'}{audio.category ? ` · ${audio.category}` : ''}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {minutes !== null && (
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--saffron)' }}>
            <i className="far fa-clock" style={{ marginRight: 5 }} />
            {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
          </div>
        )}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {new Date(session.sessionStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </div>
      </div>
    </div>
  );
}

/* ── Main UserProfile Component ─────────────────── */
export default function UserProfile() {
  const { token, logout, user: authUser } = useAuth();
  const { setCurrentAudio } = useAudio();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [fullUser, setFullUser]     = useState(null);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Edit profile state
  const [editMode, setEditMode]     = useState(false);
  const [editName, setEditName]     = useState('');
  const [editEmail, setEditEmail]   = useState('');
  const [saving, setSaving]         = useState(false);

  // Change password state
  const [pwMode, setPwMode]         = useState(false);
  const [curPw, setCurPw]           = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwSaving, setPwSaving]     = useState(false);

  // Active tab
  const [tab, setTab] = useState('history'); // 'history' | 'edit'

  // Load user + history
  useEffect(() => {
    if (!token) return;
    api.get('/auth/me')
      .then(res => {
        setFullUser(res.data);
        setEditName(res.data.fullName || '');
        setEditEmail(res.data.email || '');
      })
      .catch(() => {});

    api.get('/user/history')
      .then(res => setHistory(res.data))
      .catch(() => toast.error('Could not load listening history'))
      .finally(() => setLoading(false));
  }, [token]);

  const totalSeconds = history.reduce((s, h) => s + (h.durationListened || 0), 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const uniqueTracks = new Set(history.map(s => s.audioId?._id).filter(Boolean)).size;

  const handlePlay = (audio) => {
    setCurrentAudio(audio);
    navigate(`/details/${audio._id}`);
  };

  /* ── Avatar upload ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large. Max 5MB.'); return; }

    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFullUser(prev => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Remove profile photo?')) return;
    setAvatarLoading(true);
    try {
      await api.delete('/auth/me/avatar');
      setFullUser(prev => ({ ...prev, avatarUrl: '' }));
      toast.success('Profile photo removed');
    } catch {
      toast.error('Could not remove photo');
    } finally {
      setAvatarLoading(false);
    }
  };

  /* ── Save profile ── */
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/auth/me', { fullName: editName, email: editEmail });
      setFullUser(res.data);
      toast.success('Profile updated!');
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async () => {
    if (!curPw || !newPw) { toast.error('Fill all password fields'); return; }
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return; }
    if (newPw.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setPwSaving(true);
    try {
      await api.patch('/auth/me', { currentPassword: curPw, newPassword: newPw });
      toast.success('Password changed successfully!');
      setPwMode(false); setCurPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPwSaving(false);
    }
  };

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <i className="fas fa-lock" style={{ fontSize: '3rem', color: '#e53e3e', marginBottom: '16px', display: 'block' }} />
        <h2 style={{ color: 'var(--text-main)' }}>Not logged in</h2>
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  const displayName = fullUser?.fullName || authUser?.fullName || authUser?.username || 'User';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const avatarSrc = fullUser?.avatarUrl ? resolveUrl(fullUser.avatarUrl) : null;

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid var(--border)', background: 'var(--card-bg, rgba(255,255,255,0.04))',
    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px' }}>

      {/* ── Profile Header Card ──────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(247,168,77,0.10) 0%, rgba(255,215,0,0.06) 100%)',
        border: '1.5px solid var(--border)', borderRadius: '20px',
        padding: '28px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--saffron, #f7a84d), #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', color: '#fff', fontWeight: 800,
              overflow: 'hidden', border: '3px solid rgba(247,168,77,0.4)',
              boxShadow: '0 4px 16px rgba(247,168,77,0.25)',
            }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                : displayInitial}
              {avatarLoading && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                }}>
                  <div style={{ width: 24, height: 24, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              )}
            </div>

            {/* Camera icon button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              title="Change photo"
              style={{
                position: 'absolute', bottom: 0, right: -4,
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--saffron, #f7a84d)', border: '2px solid var(--card-bg, #111)',
                color: '#fff', fontSize: '0.75rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <i className="fas fa-camera" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          {/* User Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
              {displayName}
            </h1>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <i className="fas fa-envelope" style={{ marginRight: 6, color: 'var(--saffron)' }} />
              {fullUser?.email || 'No email set'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <i className="fas fa-user-tag" style={{ marginRight: 6, color: 'var(--saffron)' }} />
              {fullUser?.role === 'public_user' ? 'Catalog Listener' : fullUser?.role || 'User'}
            </div>
            {fullUser?.assignedWork && (
              <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(247,168,77,0.08)', borderRadius: '10px', border: '1px solid var(--saffron)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--saffron)' }}>
                  <i className="fas fa-tasks" style={{ marginRight: 6 }} />Assigned Work:
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginLeft: 8 }}>{fullUser.assignedWork}</span>
              </div>
            )}

            {/* Photo action buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                  border: '1.5px solid var(--saffron)', background: 'rgba(247,168,77,0.10)',
                  color: 'var(--saffron)', cursor: 'pointer',
                }}
              >
                <i className="fas fa-camera" style={{ marginRight: 6 }} />
                {avatarSrc ? 'Change Photo' : 'Upload Photo'}
              </button>
              {avatarSrc && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={avatarLoading}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                    border: '1.5px solid #e53e3e', background: 'rgba(229,62,62,0.08)',
                    color: '#e53e3e', cursor: 'pointer',
                  }}
                >
                  <i className="fas fa-trash-alt" style={{ marginRight: 6 }} />Remove
                </button>
              )}
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{
              padding: '8px 18px', borderRadius: '10px',
              border: '1.5px solid #e53e3e', background: 'rgba(229,62,62,0.08)',
              color: '#e53e3e', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem',
              display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0,
            }}
          >
            <i className="fas fa-sign-out-alt" /> Sign Out
          </button>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {[
          { label: 'Tracks Played',    value: history.length, icon: 'fas fa-headphones', color: 'var(--saffron)' },
          { label: 'Unique Tracks',    value: uniqueTracks,   icon: 'fas fa-music',       color: '#48bb78' },
          { label: 'Minutes Listened', value: totalMinutes,   icon: 'far fa-clock',       color: '#4299e1' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            flex: '1 1 140px', background: 'var(--card-bg, rgba(255,255,255,0.03))',
            border: '1.5px solid var(--border)', borderRadius: '16px',
            padding: '18px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <i className={icon} style={{ fontSize: '1.4rem', color, marginBottom: '8px' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{value}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4, textAlign: 'center' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1.5px solid var(--border)', paddingBottom: '0' }}>
        {[
          { key: 'history', label: 'Listening History', icon: 'fas fa-history' },
          { key: 'edit',    label: 'Edit Profile',      icon: 'fas fa-user-edit' },
          { key: 'password',label: 'Change Password',   icon: 'fas fa-lock' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '9px 16px', borderRadius: '10px 10px 0 0', border: 'none',
              background: tab === t.key ? 'var(--saffron, #f7a84d)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <i className={t.icon} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Listening History ───────────────────────────── */}
      {tab === 'history' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              <i className="fas fa-history" style={{ color: 'var(--saffron)', marginRight: 8 }} />Recent Sessions
            </h2>
            {history.length > 0 && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--border)', padding: '4px 12px', borderRadius: '99px' }}>
                {history.length} sessions
              </span>
            )}
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid rgba(247,168,77,0.2)', borderTopColor: 'var(--saffron)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)', border: '1.5px dashed var(--border)', borderRadius: '16px' }}>
              <i className="fas fa-headphones" style={{ fontSize: '2.5rem', marginBottom: 12, color: 'var(--border)', display: 'block' }} />
              <p style={{ fontWeight: 600 }}>No listening history yet.</p>
              <p style={{ fontSize: '0.85rem' }}>Play some tracks to start building your history.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map(session => (
                <HistoryItem key={session._id} session={session} onPlay={handlePlay} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Edit Profile ──────────────────────────────── */}
      {tab === 'edit' && (
        <div style={{ maxWidth: 480 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px' }}>
            <i className="fas fa-user-edit" style={{ color: 'var(--saffron)', marginRight: 8 }} />Edit Profile
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Full Name
              </label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Enter your full name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Email Address
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                placeholder="Enter your email"
                style={inputStyle}
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              style={{
                padding: '11px 24px', borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--saffron, #f7a84d), #f59e0b)',
                border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save Changes</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Change Password ────────────────────────────── */}
      {tab === 'password' && (
        <div style={{ maxWidth: 480 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px' }}>
            <i className="fas fa-lock" style={{ color: 'var(--saffron)', marginRight: 8 }} />Change Password
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Current Password',  val: curPw,     set: setCurPw },
              { label: 'New Password',       val: newPw,     set: setNewPw },
              { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {label}
                </label>
                <input
                  type="password"
                  value={val}
                  onChange={e => set(e.target.value)}
                  placeholder={label}
                  style={inputStyle}
                />
              </div>
            ))}
            <button
              onClick={handleChangePassword}
              disabled={pwSaving}
              style={{
                padding: '11px 24px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                cursor: pwSaving ? 'not-allowed' : 'pointer', opacity: pwSaving ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              {pwSaving ? <><i className="fas fa-spinner fa-spin" /> Updating...</> : <><i className="fas fa-key" /> Change Password</>}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
