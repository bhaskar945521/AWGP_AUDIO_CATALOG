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

  return (
    <button
      onClick={onClick}
      className="category-card"
      style={{ position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}
    >
      {/* Decorative branded shape */}
      <div className={`card-brand-shape ${shapeColorClass}`} style={{ top: '-30px', right: '-30px' }} />

      {/* Category Name at Top */}
      <div className="category-name" style={{ color: style.color, position: 'relative', zIndex: 2 }}>{title}</div>
      {/* Description */}
      {description && <div className="category-description" style={{ position: 'relative', zIndex: 2 }}>{description}</div>}
      {/* Image */}
      {img && (
        <img
          src={img}
          alt={title}
          loading="lazy"
          decoding="async"
          className="category-card-image"
          style={{ position: 'relative', zIndex: 2 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      {/* Count */}
      <div className="category-count" style={{ position: 'relative', zIndex: 2 }}>{count} Albums</div>
    </button>
  );
}
