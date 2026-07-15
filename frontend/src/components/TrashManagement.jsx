import React, { useState, useEffect } from 'react';
import api, { resolveUrl } from '../api';
import { toast } from 'react-hot-toast';

export default function TrashManagement() {
  const [trashed, setTrashed] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/audios/trash/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrashed(res.data);
    } catch (err) {
      toast.error('Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrash(); }, []);

  const handleRestore = async (id, title) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/audios/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`"${title}" restored to library!`);
      fetchTrash();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restore failed');
    }
  };

  const handlePermanentDelete = async (id, title) => {
    if (!window.confirm(`Permanently delete "${title}"? This CANNOT be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/audios/${id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`"${title}" permanently deleted`);
      fetchTrash();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="admin-panel-title">
          <i className="fas fa-trash-alt"></i> Audio Trash
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="admin-panel-count">{trashed.length} items</span>
          <button onClick={fetchTrash} className="btn-ghost" title="Refresh" style={{ padding: '8px 12px' }}>
            <i className="fas fa-sync-alt" />
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        background: 'rgba(247,168,77,0.08)', border: '1px solid rgba(247,168,77,0.3)',
        borderRadius: '12px', padding: '14px 18px', marginBottom: '20px',
        display: 'flex', gap: '12px', alignItems: 'flex-start'
      }}>
        <i className="fas fa-info-circle" style={{ color: '#f7a84d', marginTop: 2, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          When a non-admin operator deletes an audio, it moves here instead of being permanently removed.
          As Admin, you can <strong style={{ color: 'var(--text-main)' }}>Restore</strong> it back to the library,
          or <strong style={{ color: '#e53e3e' }}>Permanently Delete</strong> it.
        </p>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /><p>Loading trash...</p></div>
      ) : trashed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="fas fa-check-circle" style={{ color: '#10b981' }} /></div>
          <p className="empty-title">Trash is empty!</p>
          <p className="empty-desc">No deleted audios awaiting review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trashed.map(audio => {
            const img = audio.imageUrl && audio.imageUrl !== '/placeholder.png'
              ? resolveUrl(audio.imageUrl) : null;

            return (
              <div key={audio._id} style={{
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                padding: '14px 20px', borderRadius: '14px',
                background: 'var(--card-bg, rgba(255,255,255,0.03))',
                border: '1.5px solid rgba(229,62,62,0.2)',
              }}>
                {/* Thumbnail */}
                <div style={{
                  width: 52, height: 52, borderRadius: '10px', flexShrink: 0, overflow: 'hidden',
                  background: 'rgba(229,62,62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {img
                    ? <img src={img} alt={audio.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <i className="fas fa-music" style={{ color: '#e53e3e', fontSize: '1.3rem' }} />
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {audio.title}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {audio.speaker && (
                      <span><i className="fas fa-microphone" style={{ marginRight: 4 }} />{audio.speaker}</span>
                    )}
                    <span><i className="far fa-clock" style={{ marginRight: 4 }} />{audio.duration || '—'}</span>
                    {audio.deletedBy && (
                      <span style={{ color: '#e53e3e' }}>
                        <i className="fas fa-user-times" style={{ marginRight: 4 }} />
                        Deleted by: <strong>{audio.deletedBy}</strong>
                      </span>
                    )}
                    {audio.deletedAt && (
                      <span>
                        <i className="far fa-calendar-times" style={{ marginRight: 4 }} />
                        {new Date(audio.deletedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleRestore(audio._id, audio.title)}
                    className="btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                      borderRadius: '10px',
                    }}
                  >
                    <i className="fas fa-undo" /> Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(audio._id, audio.title)}
                    className="btn-ghost"
                    style={{
                      border: '1.5px solid #e53e3e',
                      color: '#e53e3e',
                      borderRadius: '10px',
                    }}
                  >
                    <i className="fas fa-times-circle" /> Delete Forever
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
