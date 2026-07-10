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
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [addToAlbumAudioId, setAddToAlbumAudioId] = useState(null);

  const urlCategory = searchParams.get('category') || '';
  const [filterCategory, setFilterCategory] = useState(urlCategory);

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
  }, [searchQuery, filterCategory, currentPage]);

  const toggleFavorite = (id) => {
    toggleFavoriteTrack(id);
  };

  const handleDelete = (id) => {
    setAudios(prev => prev.filter(a => a._id !== id));
    setTotalCount(t => t - 1);
  };

  // Reset page when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory]);

  const handleCategoryFilter = (catVal) => {
    setFilterCategory(catVal);
    setSearchParams({ category: catVal });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="library-page">
      {/* Page header */}
      <div className="page-intro">
        <h2 className="page-title">
          Audio Library
        </h2>
        <p className="page-subtitle">
          Browse all spiritual discourses, bhajans, and pravachans with advanced filters.
        </p>
        {/* Global Search */}
        <input
          type="text"
          placeholder="Search library"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="library-search-input"
        />
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

      {/* Grid */}
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
