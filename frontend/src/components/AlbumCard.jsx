import React from 'react';
import { resolveUrl } from '../api';

/**
 * Resolves cover image URL: if relative, prefixes backend host.
 */
function getCoverImageUrl(url) {
  if (!url) return '/album_placeholder.png';
  return resolveUrl(url);
}

/**
 * AlbumCard component displays an album with optional admin actions.
 *
 * Props:
 *   name        - internal slug/name of the album
 *   title       - display title
 *   description - optional description text
 *   coverImage  - URL or path to cover image
 *   count       - number of tracks in the album
 *   onClick     - callback when the card itself is clicked (navigate to album)
 *   isAdmin     - boolean indicating admin view (shows edit/delete buttons)
 *   onEdit      - callback invoked when edit button is clicked
 *   onDelete    - callback invoked when delete button is clicked
 *   index       - position index (used for alternating border colours: even=yellow, odd=orange)
 */
export default function AlbumCard({
  name,
  title,
  description,
  coverImage,
  count,
  onClick,
  isAdmin = false,
  onEdit,
  onDelete,
  index = 0,
}) {
  const img = coverImage && coverImage !== '/album_placeholder.png' && coverImage !== '/placeholder.png'
    ? getCoverImageUrl(coverImage)
    : null;
  // Even index → light-yellow border, odd index → light-orange border
  const accentClass = index % 2 === 0 ? 'album-card--yellow' : 'album-card--orange';
  const shapeColorClass = index % 2 === 0 ? 'card-brand-shape--yellow' : 'card-brand-shape--orange';

  return (
    <div className={`album-card ${accentClass}`} style={{ position: 'relative' }}>
      <button onClick={onClick} className="album-card-inner">
        {/* Cover Image with gradient overlay */}
        <div className="album-card-img-wrap">
          {img ? (
          <img
            src={img}
            alt={title || name}
            loading="lazy"
            decoding="async"
            className="album-card-image"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : null}
          <div className="album-card-img-overlay" />
        </div>
        {/* Content */}
        <div className="album-card-content" style={{ position: 'relative' }}>
          {/* Decorative branded shape */}
          <div className={`card-brand-shape ${shapeColorClass}`} style={{ top: '8px', right: '-35px' }} />

          <div className="album-card-title" style={{ position: 'relative', zIndex: 2 }}>{title || name}</div>
          {description && (
            <div className="album-card-description" style={{ position: 'relative', zIndex: 2 }}>{description}</div>
          )}
          <div className="album-card-footer" style={{ position: 'relative', zIndex: 2 }}>
            <span className="album-card-count">
              <i className="fas fa-music" />
              &nbsp;{count || 0} {count === 1 ? 'track' : 'tracks'}
            </span>
          </div>
        </div>
      </button>
      {/* Admin Actions */}
      {isAdmin && (
        <div className="album-card-admin-actions">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(e); }}
            className="album-card-admin-btn"
            title="Edit Album"
          >
            <i className="fas fa-edit" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(e); }}
            className="album-card-admin-btn album-card-admin-btn-delete"
            title="Delete Album"
          >
            <i className="fas fa-trash-alt" />
          </button>
        </div>
      )}
    </div>
  );
}
