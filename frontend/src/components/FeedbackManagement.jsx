import React, { useEffect, useState } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function FeedbackManagement() {
  const { isAdmin, hasPermission } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/feedback');
      setFeedbacks(res.data);
    } catch (err) {
      console.error('Failed to load feedback logs', err);
      toast.error('Could not load feedback logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleDelete = async (id) => {
    if (!(isAdmin || hasPermission('feedback_delete'))) {
      toast.error('Permission denied to delete feedback');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this feedback log?')) return;
    try {
      await api.delete(`/feedback/${id}`);
      toast.success('Feedback log deleted');
      setFeedbacks(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      toast.error('Failed to delete feedback');
    }
  };

  const handleUpdate = async (id, fields) => {
    try {
      const res = await api.patch(`/feedback/${id}/approve`, fields);
      toast.success(res.data.message || 'Feedback updated');
      setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, ...res.data.feedback } : f));
    } catch (err) {
      toast.error('Failed to update feedback status');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid rgba(247,168,77,0.2)', borderTopColor: 'var(--saffron)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <span className="admin-panel-title">
          <i className="fas fa-comment-alt"></i> Feedback Moderation
        </span>
        <span className="admin-panel-count">
          {feedbacks.length} logs
        </span>
      </div>

      {feedbacks.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <i className="fas fa-comments" style={{ fontSize: '2.5rem', marginBottom: '12px', color: 'var(--border)' }} />
          <p>No feedback submissions found yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
          {feedbacks.map(f => (
            <div
              key={f._id}
              style={{
                background: 'var(--card-bg, rgba(255,255,255,0.03))',
                border: '1.5px solid var(--border)',
                borderRadius: '14px',
                padding: '18px 20px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Delete Button */}
              <button
                onClick={() => (isAdmin || hasPermission('feedback_delete')) && handleDelete(f._id)}
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  color: '#e53e3e',
                  cursor: !(isAdmin || hasPermission('feedback_delete')) ? 'not-allowed' : 'pointer',
                  opacity: !(isAdmin || hasPermission('feedback_delete')) ? 0.3 : 1,
                  padding: '4px 8px',
                  fontSize: '0.95rem'
                }}
                disabled={!(isAdmin || hasPermission('feedback_delete'))}
                title={!(isAdmin || hasPermission('feedback_delete')) ? 'Delete disabled (insufficient permission)' : 'Delete Feedback Log'}
              >
                <i className="fas fa-trash-alt" />
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', paddingRight: '32px' }}>
                <div>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    {f.userId?.fullName || f.userId?.username || 'Anonymous User'}
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                    ({f.userId?.email || 'No email'})
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {new Date(f.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Rating stars if rating exists */}
              {f.rating && (
                <div style={{ display: 'flex', gap: '4px', color: 'var(--saffron)', fontSize: '0.85rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <i key={star} className={star <= f.rating ? 'fas fa-star' : 'far fa-star'} />
                  ))}
                </div>
              )}

              {/* Target Audio association banner */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <div style={{ fontSize: '0.82rem', padding: '6px 12px', background: 'var(--accent-bg, rgba(247,168,77,0.06))', border: '1px solid var(--border)', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-headphones" style={{ color: 'var(--saffron)' }} />
                  <span>
                    {f.isGeneral || !f.audioId ? (
                      <strong>General Catalog Feedback</strong>
                    ) : (
                      <>
                        Track: <strong>{f.audioId?.title}</strong> by <em>{f.audioId?.speaker || 'Unknown'}</em>
                      </>
                    )}
                  </span>
                </div>

                {/* Approval Action Toggle */}
                <button
                  onClick={() => handleUpdate(f._id, { approved: !f.approved })}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: f.approved ? '#48bb78' : 'var(--saffron-pale)',
                    border: f.approved ? '1px solid #38a169' : '1px solid var(--border-saffron)',
                    color: f.approved ? '#fff' : 'var(--text-main)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className={f.approved ? 'fas fa-check-circle' : 'far fa-circle'} />
                  {f.approved ? 'Approved (Shown in Ticker)' : 'Approve for Ticker'}
                </button>
              </div>

              {/* Short Ticker Input for edit */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Short feedback for scrolling marquee (max 100 characters):
                </label>
                <input
                  type="text"
                  key={`${f._id}-${f.shortFeedback}`}
                  defaultValue={f.shortFeedback || ''}
                  onBlur={async (e) => {
                    const text = e.target.value;
                    if (text !== (f.shortFeedback || '')) {
                      await handleUpdate(f._id, { shortFeedback: text });
                    }
                  }}
                  placeholder="Enter a brief summary (auto-saves on blur)"
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--input-bg, transparent)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Message text */}
              <p style={{ margin: '8px 0 0', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {f.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
