import React from 'react';
import { resolveUrl } from '../api';

const categoryIcons = {
  spirituality: 'fas fa-om',
  wisdom:       'fas fa-book-open',
  discourses:   'fas fa-users',
  bhajans:      'fas fa-music',
  pravachans:   'fas fa-microphone-alt',
  meditation:   'fas fa-spa',
  others:       'fas fa-globe',
};

function resolveImgUrl(url) {
  if (!url || url === '/placeholder.png') return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  return resolveUrl(url);
}

export default function CategoryMarquee({ categories = [], albums = [], onCategoryClick }) {
  if (!categories.length) return null;

  // Duplicate for seamless loop
  const items = [...categories, ...categories];

  const getAlbumCount = (catId) => {
    return albums.filter(al => {
      const cid = typeof al.categoryId === 'string' ? al.categoryId : al.categoryId?._id;
      return cid === catId;
    }).length;
  };



  return (
    <section className="cat-marquee-section">
      <div className="cat-marquee-header">
        <span className="cat-marquee-label">
          <i className="fas fa-layer-group" /> Browse Categories
        </span>
        <span className="cat-marquee-count">{categories.length} categories</span>
      </div>
      <div className="cat-marquee-track" onMouseEnter={e => e.currentTarget.querySelector('.cat-marquee-belt').style.animationPlayState = 'paused'} onMouseLeave={e => e.currentTarget.querySelector('.cat-marquee-belt').style.animationPlayState = 'running'}>
        <div className="cat-marquee-belt">
          {items.map((cat, idx) => {
            const img = resolveImgUrl(cat.coverImageUrl);
            const icon = categoryIcons[cat.name?.toLowerCase()] || 'fas fa-folder';
            const albumCount = cat.albumCount !== undefined ? cat.albumCount : getAlbumCount(cat._id);
            return (
              <button
                key={`${cat._id}-${idx}`}
                className={`cat-marquee-card${img ? ' cat-marquee-card--img' : ''}`}
                onClick={() => onCategoryClick && onCategoryClick(cat)}
                title={cat.name}
              >
                {img ? (
                  <>
                    <img
                      src={img}
                      alt={cat.name}
                      className="cat-marquee-card-bg"
                      loading="lazy"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="cat-marquee-card-overlay" />
                  </>
                ) : (
                  <div className="cat-marquee-card-icon">
                    <i className={icon} />
                  </div>
                )}
                <div className="cat-marquee-card-info">
                  <div className="cat-marquee-card-name">{cat.name}</div>
                  <div className="cat-marquee-card-meta">
                    <span><i className="fas fa-record-vinyl" /> {albumCount} {albumCount === 1 ? 'Album' : 'Albums'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
