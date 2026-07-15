import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api, { resolveUrl } from '../api';

import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Footer from './Footer';

export default function AlbumDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentAudio, setQueue, toggleFavoriteTrack, userFavorites, userReactions, fetchReactions, toggleLike, toggleDislike } = useAudio();
  const { token } = useAuth();
  const [album, setAlbum] = useState(null);
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

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
      console.error('Failed to load album data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbumData();
  }, [id]);
  
  // Fetch reactions for all audios in album when audios change
  useEffect(() => {
    if (audios.length === 0) return;
    audios.forEach(audio => {
      if (!userReactions[audio._id]) {
        fetchReactions(audio._id);
      }
    });
  }, [audios, fetchReactions, userReactions]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchAlbumData();
      }
    };
    const handleFocus = () => fetchAlbumData();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);


  const playAll = () => {
    if (audios.length === 0) return;
    setQueue(audios);
    setCurrentAudio(audios[0], true);
    toast.success(`Playing from ${album?.title}`);
  };

  const toggleFavorite = async (audioId) => {
    try {
      await toggleFavoriteTrack(audioId);
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
      <div className="hero-section album-hero-container" style={{ '--bg-image': `url('${getImageSrc()}')` }}>
        {/* Album Image on the Left */}
        <div className="album-hero-image-wrapper">
          <img
            src={getImageSrc()}
            alt={album.title}
            className="album-hero-image-1to1"
            onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
          />
        </div>

        {/* Text content on the right, matching dashboard structure */}
        <div className="hero-content">
          <span className="hero-eyebrow">
            <i className="fas fa-compact-disc" /> Album Details
          </span>
          <h1 className="hero-title">
            <span className="hero-title-line">{album.title}</span>
          </h1>
          
          <div className="hero-actions">
            {album.description && (
              <p className="hero-subtitle hero-subtitle--spaced">
                {album.description}
              </p>
            )}
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '10px' }}>
              {audios.length > 0 && (
                <button className="hero-cta" onClick={playAll}>
                  <i className="fas fa-play" style={{ marginRight: 8 }} /> Play All
                </button>
              )}
              <button className="btn-secondary album-back-btn" onClick={() => navigate('/albums')} style={{ 
                padding: '12px 28px',
                borderRadius: '99px',
                border: '2px solid var(--border-saffron)',
                background: 'white',
                fontWeight: 600,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--saffron)';
                e.currentTarget.style.color = 'var(--saffron)';
                e.currentTarget.style.background = 'var(--saffron-pale)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-saffron)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'white';
              }}>
                <i className="fas fa-arrow-left" style={{ marginRight: 8 }} /> Back to Albums
              </button>
            </div>

            <div className="hero-stats" style={{ display: 'flex', gap: '24px', justifyContent: 'flex-end', marginTop: '30px' }}>
               <div className="hero-stat" style={{ padding: '14px 24px', minWidth: '130px' }}>
                 <div className="hero-stat-number">{audios.length}</div>
                 <div className="hero-stat-label">{audios.length === 1 ? 'Track' : 'Tracks'}</div>
               </div>
            </div>
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
            <div className="audio-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {audios.map((audio, idx) => {
              const coverSrc = audio.imageUrl && audio.imageUrl !== '/placeholder.png'
                ? resolveUrl(audio.imageUrl)
                : audio.image && audio.image !== '/placeholder.png'
                  ? audio.image
                  : '/placeholder.png';
              const isFav = userFavorites.includes(audio._id);
              const reactions = userReactions[audio._id] || { liked: false, disliked: false, likeCount: 0, dislikeCount: 0 };

              return (
                <div
                  key={audio._id}
                  className="audio-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 18px',
                    background: 'var(--card-bg)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    gap: '16px',
                    border: '1px solid var(--border)',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                  onClick={() => { setQueue(audios); setCurrentAudio(audio); }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--saffron)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(247,168,77,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ 
                    width: '32px', 
                    fontWeight: 800, 
                    fontSize: '1.1rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center'
                  }}>{idx + 1}.</span>
                  <img
                    src={coverSrc}
                    alt={audio.title}
                    style={{ 
                      width: '56px', 
                      height: '56px', 
                      objectFit: 'cover', 
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    onError={e => { e.currentTarget.src = '/placeholder.png'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 700, 
                      color: 'var(--text-main)', 
                      fontSize: '1rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{audio.title}</div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--text-muted)',
                      marginTop: '2px'
                    }}>
                      {audio.speaker || 'Unknown Speaker'}
                    </div>
                  </div>
                  
                  {/* Quick Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                    {/* Like (count always visible to all, button only if logged in */}
                    {token ? (
                      <button
                        onClick={() => toggleLike(audio._id)}
                        style={{
                          background: reactions.liked ? 'rgba(247,168,77,0.12)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '10px 14px',
                          color: reactions.liked ? 'var(--saffron)' : 'var(--text-muted)',
                          fontSize: '1.05rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '99px',
                          transition: 'all 0.2s ease',
                          fontWeight: 600
                        }}
                        onMouseEnter={(e) => {
                          if (!reactions.liked) {
                            e.currentTarget.style.color = 'var(--saffron)';
                          }
                          e.currentTarget.style.background = 'rgba(247,168,77,0.18)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (!reactions.liked) {
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }
                          e.currentTarget.style.background = reactions.liked ? 'rgba(247,168,77,0.12)' : 'transparent';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Like"
                      >
                        <i className={reactions.liked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up'} />
                        {reactions.likeCount > 0 && <span style={{ fontSize: '0.85rem' }}>{reactions.likeCount}</span>}
                      </button>
                    ) : (
                      reactions.likeCount > 0 && (
                        <span style={{ 
                          padding: '10px 14px', 
                          color: 'var(--text-muted)', 
                          fontSize: '1.05rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          fontWeight: 600
                        }}>
                          <i className="far fa-thumbs-up" />
                          <span style={{ fontSize: '0.85rem' }}>{reactions.likeCount}</span>
                        </span>
                      )
                    )}
                    
                    {/* Dislike (count always visible to all, button only if logged in */}
                    {token ? (
                      <button
                        onClick={() => toggleDislike(audio._id)}
                        style={{
                          background: reactions.disliked ? 'rgba(229,62,62,0.1)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '10px 14px',
                          color: reactions.disliked ? '#e53e3e' : 'var(--text-muted)',
                          fontSize: '1.05rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '99px',
                          transition: 'all 0.2s ease',
                          fontWeight: 600
                        }}
                        onMouseEnter={(e) => {
                          if (!reactions.disliked) {
                            e.currentTarget.style.color = '#e53e3e';
                          }
                          e.currentTarget.style.background = 'rgba(229,62,62,0.15)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (!reactions.disliked) {
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }
                          e.currentTarget.style.background = reactions.disliked ? 'rgba(229,62,62,0.1)' : 'transparent';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Dislike"
                      >
                        <i className={reactions.disliked ? 'fas fa-thumbs-down' : 'far fa-thumbs-down'} />
                        {reactions.dislikeCount > 0 && <span style={{ fontSize: '0.85rem' }}>{reactions.dislikeCount}</span>}
                      </button>
                    ) : (
                      reactions.dislikeCount > 0 && (
                        <span style={{ 
                          padding: '10px 14px', 
                          color: 'var(--text-muted)', 
                          fontSize: '1.05rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          fontWeight: 600
                        }}>
                          <i className="far fa-thumbs-down" />
                          <span style={{ fontSize: '0.85rem' }}>{reactions.dislikeCount}</span>
                        </span>
                      )
                    )}
                    
                    {/* Favorite button (only if logged in */}
                    {token && (
                      <button
                        onClick={() => toggleFavoriteTrack(audio._id)}
                        style={{
                          background: isFav ? 'rgba(229,62,62,0.12)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '10px 14px',
                          color: isFav ? '#e53e3e' : 'var(--text-muted)',
                          fontSize: '1.15rem',
                          borderRadius: '99px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isFav) {
                            e.currentTarget.style.color = '#e53e3e';
                          }
                          e.currentTarget.style.background = 'rgba(229,62,62,0.18)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isFav) {
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }
                          e.currentTarget.style.background = isFav ? 'rgba(229,62,62,0.12)' : 'transparent';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <i className={isFav ? 'fas fa-heart' : 'far fa-heart'} />
                      </button>
                    )}
                    
                    {/* Share button (for all users) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const shareUrl = `${window.location.origin}/details/${audio._id}`;
                        navigator.clipboard.writeText(shareUrl).then(() => {
                          toast.success('Share link copied to clipboard!');
                        }).catch(() => {
                          toast.error('Failed to copy link');
                        });
                      }}
                      title="Share Track"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '10px 14px',
                        color: 'var(--text-muted)',
                        fontSize: '1.05rem',
                        borderRadius: '99px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--saffron)';
                        e.currentTarget.style.background = 'rgba(247,168,77,0.12)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <i className="fas fa-share-alt" />
                    </button>

                    {/* Comment button (only if logged in) */}
                    {token && (
                      <button
                        onClick={() => navigate(`/details/${audio._id}`)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '10px 14px',
                          color: 'var(--text-muted)',
                          fontSize: '1.05rem',
                          borderRadius: '99px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--saffron)';
                          e.currentTarget.style.background = 'rgba(247,168,77,0.12)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-muted)';
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Comment/Feedback"
                      >
                        <i className="far fa-comment-alt" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}
      </section>
      <Footer />
      <style>{`
        .album-hero-container {
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: center !important;
          padding: 60px 80px !important;
          background: linear-gradient(to right, rgba(255, 253, 231, 0.8) 0%, rgba(255, 249, 194, 0.9) 45%, rgba(255, 246, 165, 0.98) 80%, rgba(255, 246, 165, 1) 100%), var(--bg-image) left center / cover no-repeat !important;
          min-height: auto !important;
        }
        .album-hero-image-wrapper {
          flex: 0 0 auto;
          margin-right: auto;
          z-index: 1;
        }
        .album-hero-image-1to1 {
          width: 320px;
          height: 320px;
          object-fit: cover;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          border: 6px solid white;
          transform: perspective(1000px) rotateY(-5deg);
          transition: transform 0.3s ease;
        }
        .album-hero-image-1to1:hover {
          transform: perspective(1000px) rotateY(0deg) scale(1.02);
        }
        
        .audio-row:hover {
          border-color: var(--saffron) !important;
          box-shadow: 0 8px 24px rgba(247,168,77,0.15) !important;
        }
        @media (max-width: 900px) {
          .album-hero-container {
            flex-direction: column !important;
            padding: 40px 20px !important;
            text-align: center !important;
            background: linear-gradient(to bottom, rgba(255, 253, 231, 0.8) 0%, rgba(255, 249, 194, 0.9) 45%, rgba(255, 246, 165, 0.98) 80%, rgba(255, 246, 165, 1) 100%), var(--bg-image) center top / cover no-repeat !important;
          }
          .album-hero-image-wrapper {
            margin: 0 auto 30px auto;
          }
          .album-hero-container .hero-content,
          .album-hero-container .hero-actions,
          .album-hero-container .hero-title,
          .album-hero-container .hero-subtitle,
          .album-hero-container .hero-stats,
          .album-hero-container .hero-title-line {
            align-items: center !important;
            text-align: center !important;
            justify-content: center !important;
          }
          .album-hero-image-1to1 {
            width: 240px;
            height: 240px;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
