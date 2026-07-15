import React, { useEffect, useState } from 'react';
import api from '../api';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import AudioCard from './AudioCard';
import AddToAlbumModal from './AddToAlbumModal';
import { useAudio } from '../context/AudioContext';

const ITEMS_PER_PAGE = 12;

export default function Library() {
  const { searchQuery, setSearchQuery } = useOutletContext();
  const { setCurrentAudio, setQueue, toggleFavoriteTrack } = useAudio();
  const [searchParams, setSearchParams] = useSearchParams();

  const [audios, setAudios] = useState([]);
  const [categories, setCategories] = useState([]);
  const [extensions, setExtensions] = useState(['mp3', 'wav', 'm4a', 'aac', 'ogg']);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [addToAlbumAudioId, setAddToAlbumAudioId] = useState(null);

  const urlCategory = searchParams.get('category') || '';
  const [filterCategory, setFilterCategory] = useState(urlCategory);
  const [filterExtension, setFilterExtension] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Sync URL category param
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    if (cat) {
      setFilterCategory(cat);
    }
  }, [searchParams]);

  // Fetch category options for the chips row
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const catsRes = await api.get('/categories');
        setCategories(catsRes.data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch filtered audios dynamically from backend
  useEffect(() => {
    const fetchFilteredAudios = async () => {
      setLoading(true);
      const startTime = Date.now();
      try {
        const params = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          sort: '-createdAt'
        };
        if (searchQuery) params.search = searchQuery;
        if (filterCategory) params.category = filterCategory;
        if (filterExtension) params.extension = filterExtension;

        const res = await api.get('/audios', { params });
        const audioList = res.data.data || res.data;
        const total = res.data.total !== undefined ? res.data.total : audioList.length;
        setAudios(audioList);
        setTotalCount(total);
      } catch (err) {
        console.error('Failed to load audios', err);
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = 500 - elapsed;
        if (remaining > 0) {
          setTimeout(() => setLoading(false), remaining);
        } else {
          setLoading(false);
        }
      }
    };
    fetchFilteredAudios();
  }, [searchQuery, filterCategory, filterExtension, currentPage]);

  const toggleFavorite = (id) => {
    toggleFavoriteTrack(id);
  };

  const handleDelete = (id) => {
    setAudios(prev => prev.filter(a => a._id !== id));
    setTotalCount(t => t - 1);
  };

  // Reset page when search, category, or extension changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterExtension]);

  const handleCategoryFilter = (catVal) => {
    setFilterCategory(catVal);
    setSearchParams(catVal ? { category: catVal } : {});
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="library-page">
      {/* Page header */}
      <div className="page-intro">
        <h2 className="page-title">
          Audio Library
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Browse all spiritual discourses, bhajans, and pravachans with advanced filters.
          </p>
          {/* View mode toggle */}
          <div className="view-toggle" style={{ display: 'flex', gap: '8px', background: 'var(--surface)', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'grid' ? 'var(--saffron)' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <i className="fas fa-th" style={{ marginRight: '6px' }} /> Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'list' ? 'var(--saffron)' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <i className="fas fa-list" style={{ marginRight: '6px' }} /> List
            </button>
          </div>
        </div>
        {/* Global Search and Extension Filter */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
          <input
            type="text"
            placeholder="Search library"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="library-search-input"
            style={{ flex: 1 }}
          />
          <select
            value={filterExtension}
            onChange={(e) => setFilterExtension(e.target.value)}
            style={{
              padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem' }}
          >
            <option value="">All Formats</option>
            {extensions.map(ext => (
              <option key={ext} value={ext}>{ext.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category chips row */}
      {categories.length > 0 && (
        <div className="lib-category-chips">
          <button
            className={`lib-cat-chip${!filterCategory ? ' active' : ''}`}
            onClick={() => { setFilterCategory(''); setSearchParams({}); }}
          >
            All
          </button>
          {categories.map(cat => {
            const isActive = filterCategory === cat._id || filterCategory === cat.name;
            return (
              <button
                key={cat._id}
                className={`lib-cat-chip${isActive ? ' active' : ''}`}
                onClick={() => handleCategoryFilter(cat._id)}
              >
                {cat.name} ({cat.albumCount || 0})
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid rgba(247,168,77,0.2)', borderTopColor: 'var(--saffron)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : audios.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="fas fa-music" /></div>
          <div className="empty-title">No tracks found</div>
          <div className="empty-desc">
            No tracks match your combined search filters. Try adjusting them.
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
          <div className="audios-grid">
            {audios.map(audio => (
              <AudioCard
                key={audio._id}
                {...audio}
                onPlay={() => { setQueue(audios); setCurrentAudio(audio); }}
                onToggleFavorite={() => toggleFavorite(audio._id)}
                onDelete={handleDelete}
                onAddToAlbum={(id) => setAddToAlbumAudioId(id)}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {audios.map(audio => (
              <div
                key={audio._id}
                className="audios-list-item"
                style={{
                  display: 'flex',
                alignItems: 'center',
                padding: '16px',
                background: 'var(--surface)',
                borderRadius: '12px',
                gap: '16px',
                cursor: 'pointer'
              }}
              onClick={() => { setQueue(audios); setCurrentAudio(audio); }}
            >
                <img
                  src={audio.coverUrl || audio.artworkUrl || '/default-cover.png'}
                  style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                  alt={audio.title}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{audio.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {audio.speaker || 'Unknown'} • {audio.category || 'Uncategorized'} • {audio.durationText || ''}
                  </div>
                </div>
                <div className="engagement-buttons" style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(audio._id);
                    }}
                    style={{
                      padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                    <i className={`${audio.isFavorite ? 'fas fa-heart' : 'far fa-heart'}`} style={{ color: audio.isFavorite ? '#e74c3c' : 'inherit' }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const shareUrl = `${window.location.origin}/details/${audio._id}`;
                      navigator.clipboard.writeText(shareUrl).then(() => {
                        console.log('Share link copied');
                      });
                    }}
                    style={{
                      padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <i className="fas fa-share-alt" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                <i className="fas fa-chevron-left" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === '...' ? (
                    <span key={`dots-${i}`} className="page-dots">…</span>
                  ) : (
                    <button
                      key={item}
                      className={`page-btn${item === currentPage ? ' active' : ''}`}
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </button>
                  )
                )}
              <button className="page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <i className="fas fa-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Add to Existing Album Modal */}
      {addToAlbumAudioId && (
        <AddToAlbumModal
          audioId={addToAlbumAudioId}
          onClose={() => setAddToAlbumAudioId(null)}
        />
      )}
    </div>
  );
}
