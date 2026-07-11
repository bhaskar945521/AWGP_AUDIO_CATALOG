import React, { useEffect, useState } from 'react';
import api from '../api';
import { useOutletContext } from 'react-router-dom';
import AudioCard from './AudioCard';
import { useAudio } from '../context/AudioContext';

export default function Favorites() {
  const { searchQuery, setSearchQuery } = useOutletContext();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);
  const { setCurrentAudio, setQueue, toggleFavoriteTrack, userFavorites } = useAudio();

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/user/favorites');
      setFavorites(res.data);
    } catch (err) {
      console.error('Failed to load favorites', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFavorites(); }, []);

  // Sync favorites dynamically if they are toggled from outside this page (e.g., player, details card)
  useEffect(() => {
    setFavorites(prev => prev.filter(a => userFavorites.includes(a._id)));
  }, [userFavorites]);

  const toggleFavorite = async (id) => {
    try {
      await toggleFavoriteTrack(id);
    } catch (err) { console.error(err); }
  };

  const handleDelete = (id) => setFavorites(prev => prev.filter(a => a._id !== id));

  // Filter favorites by search query
  const q = searchQuery?.toLowerCase() || '';
  const filtered = favorites.filter(a =>
    !q ||
    a.title?.toLowerCase().includes(q) ||
    a.speaker?.toLowerCase().includes(q) ||
    a.category?.toLowerCase().includes(q)
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
          My Favorites
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Your curated collection of inspirational spiritual audio tracks.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid rgba(247,168,77,0.2)', borderTopColor: 'var(--saffron)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="fas fa-heart-broken" /></div>
          <div className="empty-title">No favorites yet</div>
          <div className="empty-desc">
            Go to the Library and click the heart icon on any audio to add it here.
          </div>
        </div>
      ) : (
        <>
          {/* Active search indicator */}
          {searchQuery && (
            <div className="search-results-header" style={{ marginBottom: 16 }}>
              <div className="search-results-left">
                <span className="search-results-badge">
                  <i className="fas fa-search" />
                  {filtered.length} of {favorites.length} favorites
                </span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  matching "<strong>{searchQuery}</strong>"
                </span>
              </div>
              <button className="search-results-clear" onClick={() => setSearchQuery('')}>
                <i className="fas fa-times" /> Clear
              </button>
            </div>
          )}

          {!searchQuery && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'var(--saffron-pale)', border: '1px solid var(--saffron-border)', padding: '4px 12px', borderRadius: 99 }}>
                {favorites.length} {favorites.length === 1 ? 'Track' : 'Tracks'}
              </span>
            </div>
          )}

          {filtered.length === 0 && searchQuery ? (
            <div className="empty-state">
              <div className="empty-icon"><i className="fas fa-search" /></div>
              <div className="empty-title">No matching favorites</div>
              <div className="empty-desc">No favorites match "{searchQuery}".</div>
              <button className="filter-chip" onClick={() => setSearchQuery('')}>Clear Search</button>
            </div>
          ) : (
            <div className="audios-grid">
              {filtered.map(audio => (
                <AudioCard
                  key={audio._id}
                  {...audio}
                  onPlay={() => { setQueue(filtered); setCurrentAudio(audio); }}
                  onToggleFavorite={() => toggleFavorite(audio._id)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
