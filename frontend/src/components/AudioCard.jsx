import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { resolveUrl } from '../api';

export default function AudioCard({
  _id, title, speaker, category, language, duration,
  isFavorite, image, imageUrl,
  onPlay, onToggleFavorite, onDelete, onAddToAlbum
}) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

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
        {isAdmin && (
          <div className="audio-options" onClick={e => e.stopPropagation()}>
            {/* Add to Existing Album */}
            <button
              className="audio-option-btn"
              title="Add to Existing Album"
              onClick={() => onAddToAlbum && onAddToAlbum(_id)}
              style={{ color: '#f7a84d' }}
            >
              <i className="fas fa-folder-plus" />
            </button>
            <button
              className="audio-option-btn delete"
              title="Delete"
              onClick={async () => {
                if (!window.confirm('Delete this audio?')) return;
                try {
                  const token = localStorage.getItem('token');
                  await axios.delete(`/api/audios/${_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (onDelete) onDelete(_id);
                } catch (err) {
                  alert(err.response?.data?.message || 'Delete failed');
                }
              }}
            >
              <i className="fas fa-trash" />
            </button>
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
          <button
            className={`favorite-btn${isFavorite ? ' active' : ''}`}
            onClick={e => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(); }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'} />
          </button>
        </div>
      </div>
    </div>
  );
}
