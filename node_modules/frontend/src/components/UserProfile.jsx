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
        background: '#fff',
        border: '1.5px solid #f0e8d8',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 2px 8px rgba(247,168,77,0.07)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#f7a84d'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(247,168,77,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0e8d8'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(247,168,77,0.07)'; }}
    >
      <div style={{
        width: 50, height: 50, borderRadius: '12px', flexShrink: 0,
        background: '#fef3e2', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid #f0e8d8',
      }}>
        {image
          ? <img src={image} alt={audio.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <i className="fas fa-music" style={{ color: '#f7a84d', fontSize: '1.1rem' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {audio.title}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 3 }}>
          {audio.speaker || 'Unknown Speaker'}{audio.category ? ` · ${audio.category}` : ''}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {minutes !== null && (
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f7a84d' }}>
            <i className="far fa-clock" style={{ marginRight: 5 }} />
            {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
          </div>
        )}
        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>
          {new Date(session.sessionStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────── */
function StatCard({ icon, value, label, color }) {
  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${color}22`,
      borderRadius: '16px',
      padding: '20px 18px',
      flex: 1,
      minWidth: 100,
      textAlign: 'center',
      boxShadow: `0 4px 16px ${color}18`,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '12px',
        background: `${color}18`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 10px',
        fontSize: '1.2rem', color,
      }}>
        <i className={icon} />
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1a1a2e', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: 5, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

/* ── Input Field ─────────────────────────────────── */
function InputField({ label, icon, ...props }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <i className={icon} style={{ marginRight: 6, color: '#f7a84d' }} />{label}
      </label>
      <input
        {...props}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: '11px',
          border: '1.5px solid #e5e7eb', background: '#fafafa',
          color: '#1a1a2e', fontSize: '0.9rem', outline: 'none',
          boxSizing: 'border-box', fontFamily: 'inherit',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = '#f7a84d'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
      />
    </div>
  );
}

/* ── Role Badge ──────────────────────────────────── */
function getRoleBadge(role) {
  if (role === 'admin') return { label: 'Admin', color: '#f7a84d', bg: '#fff8ee', icon: 'fas fa-crown' };
  if (role === 'onlyuser') return { label: 'Operator', color: '#4299e1', bg: '#eff8ff', icon: 'fas fa-user-cog' };
  return { label: 'Catalog Listener', color: '#48bb78', bg: '#f0fff4', icon: 'fas fa-headphones' };
}

/* ── Main UserProfile Component ─────────────────── */
export default function UserProfile() {
  const { token, logout, user: authUser, setUser } = useAuth();
  const { setCurrentAudio } = useAudio();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [fullUser, setFullUser]           = useState(null);
  const [history, setHistory]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const [editName, setEditName]     = useState('');
  const [editEmail, setEditEmail]   = useState('');
  const [saving, setSaving]         = useState(false);

  const [curPw, setCurPw]         = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving]   = useState(false);

  const [tab, setTab] = useState('history');

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

  const totalSeconds  = history.reduce((s, h) => s + (h.durationListened || 0), 0);
  const totalMinutes  = Math.floor(totalSeconds / 60);
  const uniqueTracks  = new Set(history.map(s => s.audioId?._id).filter(Boolean)).size;

  const handlePlay = (audio) => { setCurrentAudio(audio); navigate(`/details/${audio._id}`); };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large. Max 5MB.'); return; }
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/auth/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFullUser(prev => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      if (setUser) {
        setUser(prev => prev ? { ...prev, avatarUrl: res.data.avatarUrl } : null);
      }
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
      if (setUser) {
        setUser(prev => prev ? { ...prev, avatarUrl: '' } : null);
      }
      toast.success('Profile photo removed');
    } catch { toast.error('Could not remove photo'); }
    finally { setAvatarLoading(false); }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/auth/me', { fullName: editName, email: editEmail });
      setFullUser(res.data);
      if (setUser) {
        setUser(res.data);
      }
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!curPw || !newPw) { toast.error('Fill all password fields'); return; }
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return; }
    if (newPw.length < 6) { toast.error('Min 6 characters required'); return; }
    setPwSaving(true);
    try {
      await api.patch('/auth/me', { currentPassword: curPw, newPassword: newPw });
      toast.success('Password changed!');
      setPwMode && setPwMode(false);
      setCurPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setPwSaving(false); }
  };

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2rem', color: '#e53e3e' }}>
          <i className="fas fa-lock" />
        </div>
        <h2 style={{ color: '#1a1a2e', marginBottom: 8 }}>Not logged in</h2>
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  const displayName    = fullUser?.fullName || authUser?.fullName || authUser?.username || 'User';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const avatarSrc      = fullUser?.avatarUrl ? resolveUrl(fullUser.avatarUrl) : null;
  const badge          = getRoleBadge(fullUser?.role);

  const TABS = [
    { key: 'history',  label: 'Listening History', icon: 'fas fa-history' },
    { key: 'edit',     label: 'Edit Profile',       icon: 'fas fa-user-edit' },
    { key: 'password', label: 'Change Password',    icon: 'fas fa-lock' },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .profile-tab-btn:hover { background: #fef3e2 !important; color: #f7a84d !important; }
      `}</style>

      {/* ── Hero Header Card ──────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #fff8ee 0%, #fff 60%, #eff8ff 100%)',
        border: '2px solid #f0e8d8',
        borderRadius: '24px',
        padding: '32px 28px',
        marginBottom: '20px',
        boxShadow: '0 8px 32px rgba(247,168,77,0.12)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeIn 0.4s ease',
      }}>
        {/* Decorative circle */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(247,168,77,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(66,153,225,0.05)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', position: 'relative' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => avatarSrc && setShowFullImage(true)}
              style={{
                width: 100, height: 100, borderRadius: '50%',
                background: 'linear-gradient(135deg, #f7a84d, #f59e0b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.4rem', color: '#fff', fontWeight: 900,
                overflow: 'hidden',
                border: '4px solid #fff',
                boxShadow: '0 6px 24px rgba(247,168,77,0.35)',
                cursor: avatarSrc ? 'pointer' : 'default',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (avatarSrc) e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { if (avatarSrc) e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span>{displayInitial}</span>
              {avatarSrc && (
                <img src={avatarSrc} alt="avatar" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }} />
              )}
              {avatarLoading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                  <div style={{ width: 26, height: 26, border: '3px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              )}
            </div>
            {/* Camera button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              title="Change photo"
              style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 32, height: 32, borderRadius: '50%',
                background: '#f7a84d', border: '3px solid #fff',
                color: '#fff', fontSize: '0.78rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <i className="fas fa-camera" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>

          {/* User Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1a1a2e', margin: 0 }}>
                {displayName}
              </h1>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '4px 12px', borderRadius: '99px',
                background: badge.bg, color: badge.color,
                fontSize: '0.74rem', fontWeight: 800, border: `1.5px solid ${badge.color}33`,
              }}>
                <i className={badge.icon} />{badge.label}
              </span>
            </div>

            {fullUser?.email && (
              <div style={{ fontSize: '0.86rem', color: '#6b7280', marginBottom: '4px' }}>
                <i className="fas fa-envelope" style={{ marginRight: 7, color: '#f7a84d' }} />
                {fullUser.email}
              </div>
            )}
            {fullUser?.username && (
              <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '8px' }}>
                <i className="fas fa-at" style={{ marginRight: 6, color: '#9ca3af' }} />
                {fullUser.username}
              </div>
            )}

            {fullUser?.assignedWork && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '7px 14px', background: '#fff8ee',
                borderRadius: '10px', border: '1.5px solid #f7a84d44',
                marginBottom: '10px',
              }}>
                <i className="fas fa-tasks" style={{ color: '#f7a84d', fontSize: '0.85rem' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c17a00' }}>Assigned: </span>
                <span style={{ fontSize: '0.84rem', color: '#1a1a2e' }}>{fullUser.assignedWork}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                style={{
                  padding: '7px 16px', borderRadius: '9px', fontSize: '0.8rem', fontWeight: 700,
                  border: '1.5px solid #f7a84d', background: '#fff8ee',
                  color: '#c17a00', cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <i className="fas fa-camera" />{avatarSrc ? 'Change Photo' : 'Upload Photo'}
              </button>
              {avatarSrc && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={avatarLoading}
                  style={{
                    padding: '7px 14px', borderRadius: '9px', fontSize: '0.8rem', fontWeight: 700,
                    border: '1.5px solid #fca5a5', background: '#fff1f2',
                    color: '#dc2626', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <i className="fas fa-trash-alt" />Remove
                </button>
              )}
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{
              padding: '9px 20px', borderRadius: '11px',
              border: '1.5px solid #fca5a5', background: '#fff1f2',
              color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem',
              display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(220,38,38,0.08)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff1f2'; }}
          >
            <i className="fas fa-sign-out-alt" /> Sign Out
          </button>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', animation: 'fadeIn 0.5s ease' }}>
        <StatCard icon="fas fa-clock"      value={totalMinutes}   label="Minutes Listened" color="#f7a84d" />
        <StatCard icon="fas fa-play-circle" value={history.length} label="Total Sessions"   color="#4299e1" />
        <StatCard icon="fas fa-music"       value={uniqueTracks}   label="Unique Tracks"    color="#48bb78" />
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        border: '2px solid #f0e8d8',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(247,168,77,0.08)',
        animation: 'fadeIn 0.6s ease',
      }}>
        {/* Tab Bar */}
        <div style={{ display: 'flex', borderBottom: '2px solid #f0e8d8', background: '#fafafa' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              className="profile-tab-btn"
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '14px 10px', border: 'none',
                background: tab === t.key ? '#fff' : 'transparent',
                color: tab === t.key ? '#f7a84d' : '#6b7280',
                fontWeight: tab === t.key ? 800 : 600,
                fontSize: '0.82rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                transition: 'all 0.2s',
                borderBottom: tab === t.key ? '3px solid #f7a84d' : '3px solid transparent',
                marginBottom: '-2px',
              }}
            >
              <i className={t.icon} />{t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px' }}>

          {/* ── History Tab ───────────────────────────────── */}
          {tab === 'history' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
                  <i className="fas fa-history" style={{ color: '#f7a84d', marginRight: 8 }} />Recent Sessions
                </h2>
                {history.length > 0 && (
                  <span style={{ fontSize: '0.78rem', color: '#6b7280', background: '#f3f4f6', padding: '4px 12px', borderRadius: '99px', fontWeight: 600 }}>
                    {history.length} sessions
                  </span>
                )}
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                  <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid #fde68a', borderTopColor: '#f7a84d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#9ca3af', border: '2px dashed #f0e8d8', borderRadius: '16px', background: '#fafafa' }}>
                  <i className="fas fa-headphones" style={{ fontSize: '2.8rem', marginBottom: 14, color: '#d1d5db', display: 'block' }} />
                  <p style={{ fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>No listening history yet.</p>
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

          {/* ── Edit Profile Tab ──────────────────────────── */}
          {tab === 'edit' && (
            <div style={{ maxWidth: 480, animation: 'fadeIn 0.3s ease' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '22px' }}>
                <i className="fas fa-user-edit" style={{ color: '#f7a84d', marginRight: 8 }} />Edit Profile
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <InputField
                  label="Full Name" icon="fas fa-user"
                  value={editName} onChange={e => setEditName(e.target.value)}
                  placeholder="Enter your full name"
                />
                <InputField
                  label="Email Address" icon="fas fa-envelope"
                  type="email" value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder="Enter your email"
                />
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{
                    padding: '12px 28px', borderRadius: '11px',
                    background: saving ? '#fde68a' : 'linear-gradient(135deg, #f7a84d, #f59e0b)',
                    border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.92rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 16px rgba(247,168,77,0.3)',
                    transition: 'all 0.2s', width: 'fit-content',
                  }}
                >
                  {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save Changes</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Change Password Tab ───────────────────────── */}
          {tab === 'password' && (
            <div style={{ maxWidth: 480, animation: 'fadeIn 0.3s ease' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '22px' }}>
                <i className="fas fa-lock" style={{ color: '#f7a84d', marginRight: 8 }} />Change Password
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <InputField label="Current Password" icon="fas fa-key" type="password" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="Current password" />
                <InputField label="New Password" icon="fas fa-lock" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (min 6 chars)" />
                <InputField label="Confirm New Password" icon="fas fa-check-circle" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" />

                {/* Strength indicator */}
                {newPw.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.76rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Password Strength</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 5, borderRadius: 3,
                          background: newPw.length >= i * 3
                            ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#3b82f6' : '#22c55e'
                            : '#e5e7eb',
                          transition: 'background 0.3s',
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={pwSaving}
                  style={{
                    padding: '12px 28px', borderRadius: '11px',
                    background: pwSaving ? '#fde68a' : 'linear-gradient(135deg, #f7a84d, #f59e0b)',
                    border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.92rem',
                    cursor: pwSaving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 16px rgba(247,168,77,0.3)',
                    transition: 'all 0.2s', width: 'fit-content',
                  }}
                >
                  {pwSaving ? <><i className="fas fa-spinner fa-spin" /> Updating...</> : <><i className="fas fa-key" /> Change Password</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Image Modal Overlay ────────────────────────────────────── */}
      {showFullImage && avatarSrc && (
        <div
          onClick={() => setShowFullImage(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowFullImage(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              color: '#fff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            <i className="fas fa-times" />
          </button>

          {/* Large Image Container */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '85%',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
              border: '4px solid rgba(255,255,255,0.1)',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={avatarSrc}
              alt="Profile Full View"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
