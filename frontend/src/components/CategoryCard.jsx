import React from 'react';
import { resolveUrl } from '../api';

const colorMap = {
  spirituality: { bg: '#efe4ff', color: '#6b46c1', iconBg: '#f3ecff' },
  wisdom: { bg: '#e6fffa', color: '#2c7a7b', iconBg: '#ecfdf5' },
  discourses: { bg: '#fffbeb', color: '#b7791f', iconBg: '#fff8e1' },
  bhajans: { bg: '#fff5f5', color: '#c53030', iconBg: '#fef2f2' },
  pravachans: { bg: '#ebf8ff', color: '#2b6cb0', iconBg: '#eff6ff' },
  meditation: { bg: '#f0fdf4', color: '#166534', iconBg: '#dcfce7' },
  others: { bg: '#fff0f6', color: '#b83280', iconBg: '#fdf4ff' },
};

const defaultStyle = { bg: '#fff9f0', color: '#f7a84d', iconBg: '#fff4e6' };

/**
 * Resolves image URL: if relative, prefixes backend host.
 */
function resolveUrlUrl(url) {
  if (!url || url === '/placeholder.png') return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  return resolveUrl(url);
}

export default function CategoryCard({ title, count, icon, imageUrl, description, onClick }) {
  const key = title?.toLowerCase();
  const style = colorMap[key] || defaultStyle;
  const img = resolveUrlUrl(imageUrl);
  const shapeColorClass = (title && title.length % 2 === 0) ? 'card-brand-shape--yellow' : 'card-brand-shape--orange';

  if (img) {
    return (
      <button
        onClick={onClick}
        className="category-card category-card--image"
        title={description || title}
        style={{ cursor: 'pointer' }}
      >
        <img
          src={img}
          alt={title}
          loading="lazy"
          decoding="async"
          className="category-card-bg"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="category-card-overlay" />
        <div className="category-card-content">
          <div className="category-card-icon-wrap" style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={icon || 'fas fa-folder'} style={{ color: '#ffffff', fontSize: '1.1rem' }} />
          </div>
          <div className="category-card-name" style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>{title}</div>
          <div className="category-card-count" style={{ color: '#ffffff', background: 'rgba(0,0,0,0.45)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', backdropFilter: 'blur(4px)', fontWeight: 600 }}>
            {count || 0} {count === 1 ? 'Album' : 'Albums'}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="category-card"
      style={{ position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)' }}
    >
      {/* Decorative branded shape */}
      <div className={`card-brand-shape ${shapeColorClass}`} style={{ top: '-30px', right: '-30px' }} />

      <div className="category-icon-wrap" style={{ background: style.iconBg, color: style.color }}>
        <i className={icon || 'fas fa-folder'} />
      </div>
      <div className="category-name" style={{ color: style.color, position: 'relative', zIndex: 2 }}>{title}</div>
      {description && <div className="category-description" style={{ position: 'relative', zIndex: 2 }}>{description}</div>}
      <div className="category-count" style={{ position: 'relative', zIndex: 2 }}>{count || 0} {count === 1 ? 'Album' : 'Albums'}</div>
    </button>
  );
}
