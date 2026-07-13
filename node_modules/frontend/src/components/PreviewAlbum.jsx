import React from 'react';
import { resolveUrl } from '../api';

// Simple preview modal for an album (used in admin panel)
export default function PreviewAlbum({ album, categories, onClose }) {
  if (!album) return null;

  // Resolve category names from IDs
  const categoryList = album.categoryIds || (album.categoryId ? [album.categoryId] : []);
  const catNames = categoryList
    .map(id => {
      const targetId = id && typeof id === 'object' ? id._id : id;
      const cat = categories.find(c => c._id === targetId || c._id === (c.id && targetId));
      return cat ? cat.name : (id?.name || id);
    })
    .join(', ');

  const coverSrc = album.coverImage ? resolveUrl(album.coverImage) : '/placeholder.png';

  return (
    <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-box" style={{ maxWidth: '500px', background: '#fff', borderRadius: '12px', padding: '20px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="modal-title">Album Preview</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="modal-body" style={{ marginTop: '1rem' }}>
          <img src={coverSrc} alt={album.title} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
          <h4 style={{ marginTop: '1rem' }}>{album.title || 'Untitled Album'}</h4>
          {album.description && <p style={{ color: 'var(--text-muted)' }}>{album.description}</p>}
          {catNames && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--saffron)' }}>
              Categories: {catNames}
            </p>
          )}
        </div>
        <div className="modal-footer" style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
