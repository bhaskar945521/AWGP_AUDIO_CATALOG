import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { resolveUrl } from '../api';
import AudioCard from './AudioCard';
import { useAudio } from '../context/AudioContext';
import toast from 'react-hot-toast';
import Footer from './Footer';

export default function AlbumDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentAudio, setQueue } = useAudio();
  const [album, setAlbum] = useState(null);
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        setLoading(true);
        const [albumRes, audiosRes] = await Promise.all([
          api.get(`/albums/${id}`),
          api.get(`/audios?album=${id}`)
        ]);
        setAlbum(albumRes.data);
        
        // Handle paginated or non-paginated audio response format
        const audioList = audiosRes.data.data || audiosRes.data;
        setAudios(audioList);
      } catch (err) {
        // Detailed error logging for debugging
        const status = err?.response?.status;
        const data = err?.response?.data;
        toast.error(`Failed to load album details (status: ${status || 'unknown'})`);
        console.error('Album fetch error:', err);
        if (data) console.error('Error payload:', data);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbumData();
  }, [id]);

  const playAll = () => {
    if (audios.length === 0) return;
    setQueue(audios);
    setCurrentAudio(audios[0], true);
    toast.success(`Playing from ${album?.title}`);
  };

  const toggleFavorite = async (audioId) => {
    try {
      const res = await api.patch(`/audios/${audioId}/favorite`);
      setAudios(prev => prev.map(a => a._id === audioId ? { ...a, isFavorite: res.data.isFavorite } : a));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleDelete = (audioId) => {
    setAudios(prev => prev.filter(a => a._id !== audioId));
  };

  const getImageSrc = () => {
    if (!album?.coverImage) return '/placeholder.png';
    return resolveUrl(album.coverImage) || '/placeholder.png';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <div className="search-spinner" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="empty-state" style={{ padding: '80px 0' }}>
        <div className="empty-icon"><i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: 'var(--saffron)' }} /></div>
        <div className="empty-title">Album not found</div>
        <button className="hero-cta" onClick={() => navigate('/albums')} style={{ marginTop: 16 }}>
          Back to Albums
        </button>
      </div>
    );
  }

  return (
    <div className="album-details-page">
      {/* Album Header/Hero */}
      <div className="hero-section album-hero">
        <img
          src={getImageSrc()}
          alt={album.title}
          className="album-hero-image"
          onError={(e) => { e.target.src = '/placeholder.png'; }}
        />
        <div className="album-hero-content">
          <span className="hero-eyebrow album-hero-eyebrow">
            <i className="fas fa-compact-disc" style={{ marginRight: 6 }} /> Album
          </span>
          <h1 className="hero-title album-hero-title">
            {album.title}
          </h1>
          {album.description && (
            <p className="hero-subtitle album-hero-subtitle">
              {album.description}
            </p>
          )}
          <div className="album-hero-actions">
            {audios.length > 0 && (
              <button className="hero-cta" onClick={playAll}>
                <i className="fas fa-play" style={{ marginRight: 8 }} /> Play All
              </button>
            )}
            <button className="btn-secondary album-back-btn" onClick={() => navigate('/albums')}>
              Back to Albums
            </button>
            <span className="album-hero-count">
              {audios.length} {audios.length === 1 ? 'Track' : 'Tracks'}
            </span>
          </div>
        </div>
      </div>

      {/* Album Tracks Grid */}
      <section className="section-block section-block--spacious">
        <div className="section-header" style={{ marginBottom: 24 }}>
          <div className="section-title">Tracks in this Album</div>
        </div>

        {audios.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 0', border: '1.5px dashed var(--border)', borderRadius: 12 }}>
            <div className="empty-icon"><i className="fas fa-music" style={{ fontSize: '2.5rem' }} /></div>
            <div className="empty-title">No tracks yet</div>
            <div className="empty-desc">This album does not have any audio tracks associated with it yet.</div>
          </div>
        ) : (
          <div className="audios-grid">
            {audios.map(audio => (
              <AudioCard
                key={audio._id}
                {...audio}
                onPlay={() => { setQueue(audios); setCurrentAudio(audio); }}
                onToggleFavorite={() => toggleFavorite(audio._id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
