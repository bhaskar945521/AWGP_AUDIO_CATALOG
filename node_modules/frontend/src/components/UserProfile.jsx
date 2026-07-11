import React, { useEffect, useState } from 'react';
import api, { resolveUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

function HistoryItem({ session, onPlay }) {
  const audio = session.audioId;
  if (!audio) return null;

  const image = audio.imageUrl ? resolveUrl(audio.imageUrl) : null;
  const minutes = session.durationListened
    ? Math.floor(session.durationListened / 60)
    : null;
  const seconds = session.durationListened
    ? session.durationListened % 60
    : null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 16px',
      borderRadius: '14px',
      background: 'var(--card-bg, rgba(255,255,255,0.03))',
      border: '1.5px solid var(--border)',
      cursor: 'pointer',
      transition: 'border-color 0.2s, background 0.2s',
    }}
    onClick={() => onPlay(audio)}
    >
      {/* Thumbnail */}
      <div style={{
        width: 48, height: 48, borderRadius: '10px', flexShrink: 0,
        background: 'var(--border)',
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {image
          ? <img src={image} alt={audio.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <i className="fas fa-music" style={{ color: 'var(--saffron)', fontSize: '1.1rem' }} />
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {audio.title}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {audio.speaker || 'Unknown Speaker'}
          {audio.category ? ` · ${audio.category}` : ''}
        </div>
      </div>

      {/* Duration listened */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {minutes !== null ? (
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--saffron)' }}>
            <i className="far fa-clock" style={{ marginRight: 5 }} />
            {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
          </div>
        ) : null}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {new Date(session.sessionStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </div>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const { token, logout }  = useAuth();
  const { setCurrentAudio } = useAudio();
  const navigate             = useNavigate();

  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [fullUser, setFullUser] = useState(null);

  // Derive user info from JWT (fallback)
  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserInfo(payload);
    } catch (e) {}
  }, [token]);

  // Fetch full user details from API
  useEffect(() => {
    if (!token) return;
    api.get('/auth/me')
      .then(res => setFullUser(res.data))
      .catch(err => console.error('Could not fetch full user info', err));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api.get('/user/history')
      .then(res => setHistory(res.data))
      .catch(err => {
        console.error('History load error:', err);
        toast.error('Could not load listening history');
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Compute total listening minutes
  const totalSeconds  = history.reduce((sum, s) => sum + (s.durationListened || 0), 0);
  const totalMinutes  = Math.floor(totalSeconds / 60);
  const uniqueTracks  = new Set(history.map(s => s.audioId?._id).filter(Boolean)).size;

  const handlePlay = (audio) => {
    setCurrentAudio(audio);
    navigate(`/details/${audio._id}`);
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

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px' }}>

      {/* ── Profile Header ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
        background: 'linear-gradient(135deg, rgba(247,168,77,0.10) 0%, rgba(255,215,0,0.06) 100%)',
        border: '1.5px solid var(--border)',
        borderRadius: '20px',
        padding: '24px 28px',
        marginBottom: '28px',
      }}>
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--saffron), var(--golden))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', color: '#fff', fontWeight: 800, flexShrink: 0,
        }}>
          {(userInfo?.fullName || userInfo?.username || 'U').charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {fullUser?.fullName || userInfo?.fullName || userInfo?.username || 'User'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            <i className="fas fa-user-tag" style={{ marginRight: 6, color: 'var(--saffron)' }} />
            {fullUser?.role === 'public_user' ? 'Catalog Listener' : fullUser?.role || userInfo?.role || 'User'}
          </p>
          {/* Assigned Work */}
          {fullUser?.assignedWork && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(247,168,77,0.08)', borderRadius: '10px', border: '1px solid var(--saffron)' }}>
              <p style={{ margin:0, fontSize:'0.78rem', fontWeight:700, color:'var(--saffron)', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                <i className="fas fa-tasks" style={{ marginRight:6 }} /> Assigned Work
              </p>
              <p style={{ margin:0, fontSize:'0.88rem', color:'var(--text-main)' }}>{fullUser.assignedWork}</p>
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={() => { logout(); navigate('/'); }}
          style={{
            padding: '8px 20px', borderRadius: '10px',
            border: '1.5px solid #e53e3e', background: 'rgba(229,62,62,0.08)',
            color: '#e53e3e', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', gap: '7px',
          }}
        >
          <i className="fas fa-sign-out-alt" /> Sign Out
        </button>
      </div>

      {/* ── Quick Stats Row ────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {[
          { label: 'Tracks Played',     value: history.length,  icon: 'fas fa-headphones',  color: 'var(--saffron)' },
          { label: 'Unique Tracks',     value: uniqueTracks,    icon: 'fas fa-music',        color: '#48bb78' },
          { label: 'Minutes Listened',  value: totalMinutes,    icon: 'far fa-clock',        color: '#4299e1' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            flex: '1 1 140px',
            background: 'var(--card-bg, rgba(255,255,255,0.03))',
            border: '1.5px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <i className={icon} style={{ fontSize: '1.4rem', color, marginBottom: '8px' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{value}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4, textAlign: 'center' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Listening History List ──────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            <i className="fas fa-history" style={{ color: 'var(--saffron)', marginRight: 8 }} />
            Listening History
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
          <div style={{
            textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)',
            border: '1.5px dashed var(--border)', borderRadius: '16px',
          }}>
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
