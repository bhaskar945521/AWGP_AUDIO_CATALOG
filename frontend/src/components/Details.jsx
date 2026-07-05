import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { resolveUrl } from '../api';
import { useAudio } from '../context/AudioContext';

export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentAudio, currentAudio, isPlaying, setIsPlaying } = useAudio();

  const [audio, setAudio]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/audios/${id}`);
        setAudio(res.data);
      } catch (e) {
        setError('Failed to load audio details. Track might not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchAudio();
  }, [id]);

  const toggleFavorite = async () => {
    if (!audio) return;
    try {
      const res = await api.patch(`/audios/${audio._id}/favorite`);
      setAudio(prev => ({ ...prev, isFavorite: res.data.isFavorite }));
    } catch (err) { console.error(err); }
  };

  const handlePlay = () => {
    if (!audio) return;
    if (currentAudio?._id === audio._id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentAudio(audio);
    }
  };

  const isCurrentPlaying = currentAudio?._id === id && isPlaying;

  const displayImage = audio?.imageUrl ? resolveUrl(audio.imageUrl) : '/placeholder.png';

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ display: 'inline-block', width: 44, height: 44, border: '3px solid rgba(255,153,51,0.2)', borderTopColor: 'var(--saffron)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !audio) return (
    <div className="empty-state" style={{ maxWidth: 400, margin: '48px auto' }}>
      <div className="empty-icon"><i className="fas fa-exclamation-triangle" style={{ color: '#e53e3e' }} /></div>
      <div className="empty-title">Track Not Found</div>
      <div className="empty-desc">{error || 'This audio track does not exist.'}</div>
      <button className="filter-chip" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  return (
    <div className="details-page">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="details-back-btn"
      >
        <i className="fas fa-arrow-left" /> Go Back
      </button>

      {/* Card */}
      <div className="details-card">
        {/* Top image strip */}
        <div className="details-cover">
          <img src={displayImage} alt={audio.title} className="details-cover-image" />
          <div className="details-cover-overlay" />
          {/* Play button on cover */}
          <button
            type="button"
            onClick={handlePlay}
            className="details-cover-play"
          >
            <div className={`details-cover-play-icon${isCurrentPlaying ? ' is-playing' : ''}`}>
              <i className={`fas ${isCurrentPlaying ? 'fa-pause' : 'fa-play'}`} style={{ marginLeft: isCurrentPlaying ? 0 : 4 }} />
            </div>
          </button>

          {/* Category badge */}
          {audio.category && (
            <span className="details-badge">
              {audio.category}
            </span>
          )}

          {/* Favorite */}
          <button
            type="button"
            onClick={toggleFavorite}
            className={`details-favorite-btn${audio.isFavorite ? ' active' : ''}`}
          >
            <i className={audio.isFavorite ? 'fas fa-heart' : 'far fa-heart'} />
          </button>
        </div>

        {/* Info */}
        <div className="details-content">
          <h1 className="details-title">
            {audio.title}
          </h1>

          <div className="details-meta">
            <div className="details-meta-item">
              <i className="fas fa-user" style={{ color: 'var(--saffron)' }} />
              <span>{audio.speaker || 'Unknown Speaker'}</span>
            </div>
            <div className="details-meta-item">
              <i className="far fa-clock" style={{ color: 'var(--saffron)' }} />
              <span>{audio.duration || '—'}</span>
            </div>
            <div className="details-meta-item">
              <i className="far fa-calendar" style={{ color: 'var(--saffron)' }} />
              <span>{audio.date || new Date(audio.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            {audio.language && (
              <span className="details-language-pill">
                {audio.language}
              </span>
            )}
          </div>

          {audio.description && (
            <p className="details-description">
              {audio.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="details-actions">
            <button
              type="button"
              onClick={handlePlay}
              className={`details-primary-btn${isCurrentPlaying ? ' active' : ''}`}
            >
              <i className={`fas ${isCurrentPlaying ? 'fa-pause' : 'fa-play'}`} />
              {isCurrentPlaying ? 'Pause' : 'Play Now'}
            </button>

            <button
              type="button"
              onClick={toggleFavorite}
              className={`details-secondary-btn${audio.isFavorite ? ' active' : ''}`}
            >
              <i className={audio.isFavorite ? 'fas fa-heart' : 'far fa-heart'} />
              {audio.isFavorite ? 'Favorited' : 'Add to Favorites'}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
