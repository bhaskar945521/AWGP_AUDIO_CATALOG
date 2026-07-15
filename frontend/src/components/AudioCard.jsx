import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { resolveUrl } from '../api';
import { toast } from 'react-hot-toast';

export default function AudioCard({
  _id, title, speaker, category, language, duration,
  isFavorite, image, imageUrl, audioUrl,
  onPlay, onToggleFavorite, onDelete, onAddToAlbum
}) {
  const { isAdmin, hasPermission, token } = useAuth();
  const { userFavorites, toggleFavoriteTrack, userReactions, fetchReactions, toggleLike, toggleDislike } = useAudio();
  const navigate = useNavigate();
  
  const canEditAudio   = isAdmin || hasPermission('audio_edit');
  const canDeleteAudio = isAdmin || hasPermission('audio_delete');
  const canAddToAlbum  = isAdmin || hasPermission('album_edit');
  const canDownload    = isAdmin || hasPermission('audios_download');
  const showAdminOptions = canEditAudio || canDeleteAudio || canAddToAlbum || canDownload;

  const finalIsFavorite = userFavorites.includes(_id);
  const reactions = userReactions[_id] || { liked: false, disliked: false, likeCount: 0, dislikeCount: 0 };

  useEffect(() => {
    if (_id && !userReactions[_id]) {
      fetchReactions(_id);
    }
  }, [_id, fetchReactions, userReactions]);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavoriteTrack(_id);
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    toggleLike(_id);
  };

  const handleDislikeClick = (e) => {
    e.stopPropagation();
    toggleDislike(_id);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/details/${_id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Share link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    if (!audioUrl) return toast.error('Audio file not available');
    const url = resolveUrl(audioUrl);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'audio'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started!');
  };

  const displayImage = image && image !== '/placeholder.png'
    ? image
    : imageUrl && imageUrl !== '/placeholder.png'
      ? resolveUrl(imageUrl)
      : null;
  const shapeColorClass = (_id && _id.length > 0 && _id.charCodeAt(_id.length - 1) % 2 === 0) ? 'card-brand-shape--yellow' : 'card-brand-shape--orange';

  return (
    <div className="audio-card" onClick={() => navigate(`/details/${_id}`)}>
      <div className="audio-thumbnail-container">
        {displayImage ? (
          <img src={displayImage} alt={title} loading="lazy" decoding="async" className="audio-thumbnail" />
        ) : null}

        {/* Category badge */}
        {category && category !== 'Uncategorized' && (
          <span className="audio-category-badge">{category}</span>
        )}

        {/* Play overlay */}
        <div className="audio-overlay" />

        <div
          className="play-button"
          onClick={e => { e.stopPropagation(); onPlay && onPlay(); }}
        >
          <i className="fas fa-play" />
        </div>

        {/* Admin options */}
        {showAdminOptions && (
          <div className="audio-options" onClick={e => e.stopPropagation()}>
            {/* Add to Existing Album */}
            {canAddToAlbum && (
              <button
                className="audio-option-btn"
                title="Add to Existing Album"
                onClick={() => onAddToAlbum && onAddToAlbum(_id)}
                style={{ color: '#f7a84d' }}
              >
                <i className="fas fa-folder-plus" />
              </button>
            )}
            {/* Download */}
            {canDownload && (
              <button
                className="audio-option-btn"
                title="Download Audio"
                onClick={handleDownloadClick}
                style={{ color: '#10b981' }}
              >
                <i className="fas fa-download" />
              </button>
            )}
            {canDeleteAudio && (
              <button
                className="audio-option-btn delete"
                title="Delete"
                onClick={async () => {
                  if (!window.confirm('Delete this audio?')) return;
                  try {
                    await api.delete(`/audios/${_id}`);
                    if (onDelete) onDelete(_id);
                  } catch (err) {
                    alert(err.response?.data?.message || 'Delete failed');
                  }
                }}
              >
                <i className="fas fa-trash" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="audio-info" style={{ position: 'relative' }}>
        {/* Decorative branded shape */}
        <div className={`card-brand-shape ${shapeColorClass}`} style={{ top: '8px', right: '-35px' }} />

        <div className="audio-title" title={title} style={{ position: 'relative', zIndex: 2 }}>{title}</div>
        <div className="audio-speaker" style={{ position: 'relative', zIndex: 2 }}>
          <i className="fas fa-user" style={{ marginRight: 5, fontSize: '0.7rem', opacity: 0.7 }} />
          {speaker || 'Unknown Speaker'}
        </div>
        <div className="audio-meta" style={{ position: 'relative', zIndex: 2 }}>
          <span className="audio-duration">
            <i className="far fa-clock" />
            {duration || '—'}
          </span>
          {language && <span className="audio-lang">{language}</span>}
          
          {/* Like count + button (button only if token exists */}
          {token ? (
            <button
              onClick={handleLikeClick}
              style={{
                background: reactions.liked ? 'rgba(247,168,77,0.1)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 10px',
                color: reactions.liked ? 'var(--saffron)' : 'var(--text-muted)',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!reactions.liked) {
                  e.currentTarget.style.color = 'var(--saffron)';
                }
                e.currentTarget.style.background = 'rgba(247,168,77,0.15)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                if (!reactions.liked) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
                e.currentTarget.style.background = reactions.liked ? 'rgba(247,168,77,0.1)' : 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Like"
            >
              <i className={reactions.liked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up'} />
              {reactions.likeCount > 0 && <span style={{ fontSize: '0.8rem' }}>{reactions.likeCount}</span>}
            </button>
          ) : (
            reactions.likeCount > 0 && (
              <span style={{ 
                padding: '8px 10px', 
                color: 'var(--text-muted)', 
                fontSize: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px' 
              }}>
                <i className="far fa-thumbs-up" />
                <span style={{ fontSize: '0.8rem' }}>{reactions.likeCount}</span>
              </span>
            )
          )}
          
          {/* Dislike count + button (button only if token exists */}
          {token ? (
            <button
              onClick={handleDislikeClick}
              style={{
                background: reactions.disliked ? 'rgba(229,62,62,0.1)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 10px',
                color: reactions.disliked ? '#e53e3e' : 'var(--text-muted)',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!reactions.disliked) {
                  e.currentTarget.style.color = '#e53e3e';
                }
                e.currentTarget.style.background = 'rgba(229,62,62,0.15)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                if (!reactions.disliked) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
                e.currentTarget.style.background = reactions.disliked ? 'rgba(229,62,62,0.1)' : 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Dislike"
            >
              <i className={reactions.disliked ? 'fas fa-thumbs-down' : 'far fa-thumbs-down'} />
              {reactions.dislikeCount > 0 && <span style={{ fontSize: '0.8rem' }}>{reactions.dislikeCount}</span>}
            </button>
          ) : (
            reactions.dislikeCount > 0 && (
              <span style={{ 
                padding: '8px 10px', 
                color: 'var(--text-muted)', 
                fontSize: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px' 
              }}>
                <i className="far fa-thumbs-down" />
                <span style={{ fontSize: '0.8rem' }}>{reactions.dislikeCount}</span>
              </span>
            )
          )}
          
          <button
            onClick={handleShareClick}
            title="Share Track"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 10px',
              color: 'var(--text-muted)',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--saffron)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <i className="fas fa-share-alt" />
          </button>

          <button
            className={`favorite-btn${finalIsFavorite ? ' active' : ''}`}
            onClick={handleFavoriteClick}
            title={finalIsFavorite ? 'Remove from favorites' : 'Add to favorites'}
            style={!token ? { cursor: 'default', opacity: 0.5 } : {}}
          >
            <i className={finalIsFavorite ? 'fas fa-heart' : 'far fa-heart'} />
          </button>
        </div>
      </div>
    </div>
  );
}
