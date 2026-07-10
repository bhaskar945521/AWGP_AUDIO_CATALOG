import React, { useEffect, useState } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';

function StatCard({ icon, label, value, color = 'var(--saffron)' }) {
  return (
    <div style={{
      background: 'var(--card-bg, rgba(255,255,255,0.03))',
      border: '1.5px solid var(--border)',
      borderRadius: '16px',
      padding: '22px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '18px',
      flex: '1 1 180px',
      minWidth: '160px',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', color,
        flexShrink: 0,
      }}>
        <i className={icon} />
      </div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
          {value?.toLocaleString() ?? '—'}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics')
      .then(res => setData(res.data))
      .catch(err => {
        console.error('Analytics load error', err);
        toast.error('Failed to load analytics data');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-panel" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid rgba(247,168,77,0.2)', borderTopColor: 'var(--saffron)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) return null;

  const { totals, topLiked, recentFeedback, userActivity = [] } = data;

  // Format seconds → human readable (e.g. "2h 14m" or "45m")
  const fmtDuration = (secs) => {
    if (!secs || secs <= 0) return '—';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const roleColor = (role) => {
    if (role === 'admin') return '#f7a84d';
    if (role === 'onlyuser') return '#9f7aea';
    if (role === 'public_user') return '#48bb78';
    return 'var(--text-muted)';
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <span className="admin-panel-title">
          <i className="fas fa-chart-bar" /> Analytics Dashboard
        </span>
        <span className="admin-panel-count">Live Stats</span>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────── */}
      <div style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
        <StatCard icon="fas fa-heart"              label="Total Favorites"       value={totals.favorites}          color="var(--saffron)" />
        <StatCard icon="fas fa-thumbs-up"          label="Total Likes"           value={totals.likes}              color="#48bb78" />
        <StatCard icon="fas fa-thumbs-down"        label="Total Dislikes"        value={totals.dislikes}           color="#e53e3e" />
        <StatCard icon="fas fa-comment-alt"        label="Feedback Submissions"  value={totals.feedback}           color="#9f7aea" />
        <StatCard icon="fas fa-headphones"         label="Listening Sessions"    value={totals.sessions}           color="#4299e1" />
        <StatCard icon="fas fa-clock"              label="Minutes Listened"      value={totals.listeningMinutes}   color="#ed8936" />
        <StatCard icon="fas fa-users"              label="Unique Listeners"      value={totals.uniqueListeners}    color="#38b2ac" />
      </div>

      <div style={{ display: 'flex', gap: '20px', padding: '0 20px 20px', flexWrap: 'wrap' }}>
        {/* ── Top Liked Tracks ───────────────────────────── */}
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            <i className="fas fa-fire" style={{ color: 'var(--saffron)', marginRight: '6px' }} />
            Top Liked Tracks
          </div>
          {topLiked.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No likes recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topLiked.map((t, idx) => (
                <div key={t._id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 16px', borderRadius: '12px',
                  background: 'var(--card-bg, rgba(255,255,255,0.03))',
                  border: '1.5px solid var(--border)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: idx === 0 ? 'linear-gradient(135deg, #f6d365, #fda085)'
                              : idx === 1 ? 'linear-gradient(135deg, #c0c0c0, #a8a8a8)'
                              : idx === 2 ? 'linear-gradient(135deg, #cd7f32, #b87333)'
                              : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.75rem', color: '#fff',
                    flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title || 'Unknown Track'}
                    </div>
                    {t.speaker && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.speaker}</div>
                    )}
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--saffron)', fontSize: '0.95rem', flexShrink: 0 }}>
                    <i className="fas fa-thumbs-up" style={{ marginRight: 5 }} />
                    {t.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent Feedback ────────────────────────────── */}
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            <i className="fas fa-comment-dots" style={{ color: '#9f7aea', marginRight: '6px' }} />
            Recent Feedback
          </div>
          {recentFeedback.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No feedback received yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentFeedback.map(f => (
                <div key={f._id} style={{
                  padding: '12px 16px', borderRadius: '12px',
                  background: 'var(--card-bg, rgba(255,255,255,0.03))',
                  border: '1.5px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {f.userId?.fullName || f.userId?.username || 'Anonymous'}
                    </strong>
                    {f.rating && (
                      <div style={{ display: 'flex', gap: '2px', color: 'var(--saffron)', fontSize: '0.75rem' }}>
                        {[1,2,3,4,5].map(s => <i key={s} className={s <= f.rating ? 'fas fa-star' : 'far fa-star'} />)}
                      </div>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {f.message}
                  </p>
                  {f.audioId?.title && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--saffron)' }}>
                      <i className="fas fa-music" style={{ marginRight: 4 }} />{f.audioId.title}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── User Activity Table ─────────────────────────────── */}
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
          <i className="fas fa-user-clock" style={{ color: '#4299e1', marginRight: '7px' }} />
          User Activity — App Usage Time
        </div>

        {userActivity.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '16px 0' }}>
            No listening sessions recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1.5px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--card-bg, rgba(255,255,255,0.04))' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid var(--border)' }}>#</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid var(--border)' }}>User</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid var(--border)' }}>Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid var(--border)' }}>Sessions</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid var(--border)' }}>Time Listened</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid var(--border)' }}>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {userActivity.map((u, idx) => (
                  <tr
                    key={u._id}
                    style={{
                      borderBottom: idx < userActivity.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(247,168,77,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {u.fullName || u.username || 'Unknown'}
                      </div>
                      {u.email && (
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      )}
                      {!u.fullName && !u.email && u.username && (
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 99,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: `${roleColor(u.role)}18`,
                        color: roleColor(u.role),
                        border: `1px solid ${roleColor(u.role)}44`,
                        textTransform: 'capitalize',
                      }}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#4299e1' }}>
                      {u.sessionCount}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 800, color: 'var(--saffron)', fontSize: '0.95rem' }}>
                        <i className="fas fa-clock" style={{ marginRight: 5, opacity: 0.7 }} />
                        {fmtDuration(u.totalSeconds)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {fmtDate(u.lastSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
