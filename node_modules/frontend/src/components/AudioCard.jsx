import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { resolveUrl } from '../api';

export default function AudioCard({
  _id, title, speaker, category, language, duration,
  isFavorite, image, imageUrl,
  onPlay, onToggleFavorite, onDelete, onAddToAlbum
}) {
  const { isAdmin, hasPermission, token } = useAuth();
  const { userFavorites, toggleFavoriteTrack, userReactions, fetchReactions, toggleLike, toggleDislike } = useAudio();
  const navigate = useNavigate();
  
  const canEditAudio = isAdmin || hasPermission('audio_edit');
  const canDeleteAudio = isAdmin || hasPermission('audio_delete');
  const canAddToAlbum = isAdmin || hasPermission('album_edit');
  const showAdminOptions = canEditAudio || canDeleteAudio || canAddToAlbum;

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
          
          {/* Like count + button (button only if token exists) */}
          {token ? (
            <button
              onClick={handleLikeClick}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: reactions.liked ? 'var(--saffron)' : 'var(--text-muted)',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <i className={reactions.liked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up'} />
              {reactions.likeCount > 0 && <span style={{ fontSize: '0.75rem' }}>{reactions.likeCount}</span>}
            </button>
          ) : (
            reactions.likeCount > 0 && (
              <span style={{ 
                padding: '4px', 
                color: 'var(--text-muted)', 
                fontSize: '0.9rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '3px' 
              }}>
                <i className="far fa-thumbs-up" />
                <span style={{ fontSize: '0.75rem' }}>{reactions.likeCount}</span>
              </span>
            )
          )}
          
          {/* Dislike count + button (button only if token exists) */}
          {token ? (
            <button
              onClick={handleDislikeClick}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: reactions.disliked ? '#e53e3e' : 'var(--text-muted)',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <i className={reactions.disliked ? 'fas fa-thumbs-down' : 'far fa-thumbs-down'} />
              {reactions.dislikeCount > 0 && <span style={{ fontSize: '0.75rem' }}>{reactions.dislikeCount}</span>}
            </button>
          ) : (
            reactions.dislikeCount > 0 && (
              <span style={{ 
                padding: '4px', 
                color: 'var(--text-muted)', 
                fontSize: '0.9rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '3px' 
              }}>
                <i className="far fa-thumbs-down" />
                <span style={{ fontSize: '0.75rem' }}>{reactions.dislikeCount}</span>
              </span>
            )
          )}
          
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
