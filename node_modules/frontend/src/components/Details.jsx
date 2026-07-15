import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { resolveUrl } from '../api';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentAudio, currentAudio, isPlaying, setIsPlaying,
          toggleFavoriteTrack, userFavorites, userReactions, fetchReactions, toggleLike, toggleDislike } = useAudio();
  const { token, isAdmin, hasPermission } = useAuth();

  const canDownload = isAdmin || hasPermission('audios_download');
  const canPrint = isAdmin || hasPermission('audios_print');

  const [audio, setAudio]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Reactions state from AudioContext
  const reactions = userReactions[id] || { liked: false, disliked: false, likeCount: 0, dislikeCount: 0 };

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg]   = useState('');
  const [shortFeedback, setShortFeedback] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // ─── Fetch audio details ────────────────────────────────────
  useEffect(() => {
    const fetchAudio = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/audios/${id}`);
        setAudio(res.data);
      } catch (e) {
        setError('Failed to load audio details. Track might not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchAudio();
  }, [id]);

  // ─── Fetch reactions (likes/dislikes) for all users ─────────
  useEffect(() => {
    if (id) {
      fetchReactions(id);
    }
  }, [id, fetchReactions]);

  // ─── Toggle favorite ────────────────────────────────────────
  const toggleFavorite = async () => {
    if (!audio) return;
    toggleFavoriteTrack(audio._id);
  };

  const isFav = userFavorites.includes(audio?._id);

  // ─── Handle Share ───────────────────────────────────────────
  const handleShareClick = () => {
    const shareUrl = `${window.location.origin}/details/${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Share link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  // ─── Handle Download ────────────────────────────────────
  const handleDownload = () => {
    if (!audio?.audioUrl) return toast.error('Audio file not available');
    const url = resolveUrl(audio.audioUrl);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${audio.title || 'audio'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started!');
  };

  // ─── Handle Print ────────────────────────────────────────
  const handlePrint = () => {
    if (!audio) return;
    const printWindow = window.open('', '_blank', 'width=700,height=900');
    const imgSrc = audio.imageUrl ? resolveUrl(audio.imageUrl) : '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AWGP Audio - ${audio.title}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; max-width: 600px; margin: auto; }
            .header { display: flex; gap: 24px; align-items: center; border-bottom: 2px solid #f7a84d; padding-bottom: 20px; margin-bottom: 24px; }
            .cover { width: 120px; height: 120px; object-fit: cover; border-radius: 12px; }
            .cover-placeholder { width: 120px; height: 120px; background: #f7a84d22; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 3rem; }
            h1 { font-size: 1.6rem; margin: 0 0 8px; color: #1a1a1a; }
            .meta { font-size: 0.9rem; color: #555; margin: 4px 0; }
            .label { font-weight: 700; color: #f7a84d; font-size: 0.8rem; text-transform: uppercase; margin-top: 20px; margin-bottom: 6px; }
            .desc { font-size: 0.95rem; line-height: 1.6; color: #333; }
            .tags { display: flex; flex-wrap: wrap; gap: 6px; }
            .tag { background: #f7a84d22; color: #c47f00; padding: 4px 10px; border-radius: 99px; font-size: 0.8rem; font-weight: 600; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 0.78rem; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            ${imgSrc ? `<img src="${imgSrc}" class="cover" alt="Cover" />` : '<div class="cover-placeholder">🎵</div>'}
            <div>
              <h1>${audio.title || 'Untitled'}</h1>
              <p class="meta">🎤 ${audio.speaker || 'Unknown Speaker'}</p>
              <p class="meta">⏱ ${audio.duration || '—'}</p>
              <p class="meta">📅 ${new Date(audio.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          ${audio.description ? `<div class="label">Description</div><div class="desc">${audio.description}</div>` : ''}
          ${audio.tags?.length ? `<div class="label">Tags</div><div class="tags">${audio.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
          <div class="footer">Printed from AWGP Audio Archive — ${window.location.origin}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  // ─── Handle play / pause ────────────────────────────────────
  const handlePlay = () => {
    if (!audio) return;
    if (currentAudio?._id === audio._id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentAudio(audio);
    }
  };

  const isCurrentPlaying = currentAudio?._id === id && isPlaying;

  // ─── Like / Dislike ─────────────────────────────────────────
  const handleLike = async () => {
    if (!token) return toast.error('Please log in to like tracks.');
    await toggleLike(id);
  };

  const handleDislike = async () => {
    if (!token) return toast.error('Please log in to react to tracks.');
    await toggleDislike(id);
  };

  // ─── Feedback submission ────────────────────────────────────
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;
    setFeedbackSubmitting(true);
    try {
      await api.post(`/audio/${id}/feedback`, {
        message: feedbackMsg,
        rating: feedbackRating || null,
        shortFeedback: shortFeedback,
      });
      toast.success('Feedback submitted! Thank you.');
      setFeedbackMsg('');
      setFeedbackRating(0);
      setShortFeedback('');
      setShowFeedback(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const displayImage = audio?.imageUrl ? resolveUrl(audio.imageUrl) : '/placeholder.png';

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ display: 'inline-block', width: 44, height: 44, border: '3px solid rgba(255,153,51,0.2)', borderTopColor: 'var(--saffron)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !audio) return (
    <div className="empty-state" style={{ maxWidth: 400, margin: '48px auto' }}>
      <div className="empty-icon"><i className="fas fa-exclamation-triangle" style={{ color: '#e53e3e' }} /></div>
      <div className="empty-title">Track Not Found</div>
      <div className="empty-desc">{error || 'This audio track does not exist.'}</div>
      <button className="filter-chip" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  return (
    <div className="details-page">
      {/* Back */}
      <button type="button" onClick={() => navigate(-1)} className="details-back-btn">
        <i className="fas fa-arrow-left" /> Go Back
      </button>

      {/* Card */}
      <div className="details-card">
        {/* Top image strip */}
        <div className="details-cover">
          <img src={displayImage} alt={audio.title} className="details-cover-image" />
          <div className="details-cover-overlay" />
          {/* Play button on cover */}
          <button type="button" onClick={handlePlay} className="details-cover-play">
            <div className={`details-cover-play-icon${isCurrentPlaying ? ' is-playing' : ''}`}>
              <i className={`fas ${isCurrentPlaying ? 'fa-pause' : 'fa-play'}`} style={{ marginLeft: isCurrentPlaying ? 0 : 4 }} />
            </div>
          </button>

          {/* Category badge */}
          {audio.category && (
            <span className="details-badge">{audio.category}</span>
          )}

          {/* Favorite */}
          <button
            type="button"
            onClick={toggleFavorite}
            className={`details-favorite-btn${isFav ? ' active' : ''}`}
          >
            <i className={isFav ? 'fas fa-heart' : 'far fa-heart'} />
          </button>
        </div>

        {/* Info */}
        <div className="details-content">
          <h1 className="details-title">{audio.title}</h1>

          <div className="details-meta">
            <div className="details-meta-item">
              <i className="fas fa-user" style={{ color: 'var(--saffron)' }} />
              <span>{audio.speaker || 'Unknown Speaker'}</span>
            </div>
            <div className="details-meta-item">
              <i className="far fa-clock" style={{ color: 'var(--saffron)' }} />
              <span>{audio.duration || '—'}</span>
            </div>
            <div className="details-meta-item">
              <i className="far fa-calendar" style={{ color: 'var(--saffron)' }} />
              <span>{audio.date || new Date(audio.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            {audio.language && (
              <span className="details-language-pill">{audio.language}</span>
            )}
          </div>

          {audio.description && (
            <p className="details-description">{audio.description}</p>
          )}

          {/* ── Main Action Buttons ────────────────────────────── */}
          <div className="details-actions">
            <button
              type="button"
              onClick={handlePlay}
              className={`details-primary-btn${isCurrentPlaying ? ' active' : ''}`}
            >
              <i className={`fas ${isCurrentPlaying ? 'fa-pause' : 'fa-play'}`} />
              {isCurrentPlaying ? 'Pause' : 'Play Now'}
            </button>

            <button
              type="button"
              onClick={toggleFavorite}
              className={`details-secondary-btn${isFav ? ' active' : ''}`}
            >
              <i className={isFav ? 'fas fa-heart' : 'far fa-heart'} />
              {isFav ? 'Favorited' : 'Add to Favorites'}
            </button>

            <button
              type="button"
              onClick={handleShareClick}
              className="details-secondary-btn"
            >
              <i className="fas fa-share-alt" />
              Share
            </button>

            {canDownload && (
              <button
                type="button"
                onClick={handleDownload}
                className="details-secondary-btn details-action-saffron"
              >
                <i className="fas fa-download" />
                Download
              </button>
            )}

            {canPrint && (
              <button
                type="button"
                onClick={handlePrint}
                className="details-secondary-btn details-action-saffron"
              >
                <i className="fas fa-print" />
                Print
              </button>
            )}
          </div>

          {/* ── Like / Dislike / Feedback row ─────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '18px',
            flexWrap: 'wrap'
          }}>
            {/* Like (count always visible, button only if logged in */}
            {token ? (
              <button
                type="button"
                onClick={handleLike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: reactions.liked ? '1.5px solid var(--saffron)' : '1.5px solid var(--border)',
                  background: reactions.liked ? 'rgba(247,168,77,0.12)' : 'transparent',
                  color: reactions.liked ? 'var(--saffron)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                <i className={reactions.liked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up'} />
                <span>{reactions.likeCount}</span>
              </button>
            ) : (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1.5px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}>
                <i className="far fa-thumbs-up" />
                <span>{reactions.likeCount}</span>
              </span>
            )}

            {/* Dislike (count always visible, button only if logged in */}
            {token ? (
              <button
                type="button"
                onClick={handleDislike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: reactions.disliked ? '1.5px solid #e53e3e' : '1.5px solid var(--border)',
                  background: reactions.disliked ? 'rgba(229,62,62,0.08)' : 'transparent',
                  color: reactions.disliked ? '#e53e3e' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                <i className={reactions.disliked ? 'fas fa-thumbs-down' : 'far fa-thumbs-down'} />
                <span>{reactions.dislikeCount}</span>
              </button>
            ) : (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1.5px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}>
                <i className="far fa-thumbs-down" />
                <span>{reactions.dislikeCount}</span>
              </span>
            )}

            {/* Feedback button (only if logged in */}
            {token && (
              <button
                type="button"
                onClick={() => setShowFeedback(v => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1.5px solid var(--border)',
                  background: showFeedback ? 'rgba(247,168,77,0.08)' : 'transparent',
                  color: showFeedback ? 'var(--saffron)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                <i className="far fa-comment-alt" />
                <span>Feedback</span>
              </button>
            )}
          </div>

          {/* ── Feedback Form ──────────────────────────────────── */}
          {showFeedback && token && (
            <form
              onSubmit={handleFeedbackSubmit}
              style={{
                marginTop: '16px',
                padding: '18px 20px',
                background: 'var(--card-bg, rgba(255,255,255,0.04))',
                border: '1.5px solid var(--border)',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your Feedback
              </label>

              {/* Star rating */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star === feedbackRating ? 0 : star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.3rem',
                      color: star <= feedbackRating ? 'var(--saffron)' : 'var(--border)',
                      padding: 0,
                      transition: 'color 0.15s',
                    }}
                  >
                    <i className={star <= feedbackRating ? 'fas fa-star' : 'far fa-star'} />
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={shortFeedback}
                onChange={e => setShortFeedback(e.target.value)}
                placeholder="Short feedback summary for public marquee (e.g., Very peaceful! - max 100 chars)"
                maxLength={100}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border)',
                  background: 'var(--input-bg, transparent)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />

              <textarea
                value={feedbackMsg}
                onChange={e => setFeedbackMsg(e.target.value)}
                placeholder="Share your thoughts about this track..."
                maxLength={2000}
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border)',
                  background: 'var(--input-bg, transparent)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowFeedback(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackSubmitting || !feedbackMsg.trim()}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(90deg, var(--saffron), var(--golden))',
                    color: '#fff',
                    cursor: feedbackSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    opacity: feedbackSubmitting ? 0.7 : 1,
                  }}
                >
                  {feedbackSubmitting ? (
                    <><i className="fas fa-spinner fa-spin" /> Submitting...</>
                  ) : (
                    <><i className="fas fa-paper-plane" /> Submit</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
