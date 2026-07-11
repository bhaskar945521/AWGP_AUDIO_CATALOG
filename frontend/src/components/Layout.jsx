import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAudio, REPEAT_NONE, REPEAT_ONE, REPEAT_ALL } from '../context/AudioContext';
import { resolveUrl } from '../api';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';
import AudioPlayer from './AudioPlayer';
import UploadAudioModal from './UploadAudioModal';
import FeedbackMarquee from './FeedbackMarquee';

/* ─── Mobile bottom navigation bar ─────────────────────── */
function MobileBottomNav({ isAdmin, isUser, isOnlyUser }) {
  const navigate = useNavigate();
  const showAdminPanel = isAdmin || isOnlyUser;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <NavLink to="/" end className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
        <i className="fas fa-home" />
        <span>Home</span>
      </NavLink>

      <NavLink to="/library" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
        <i className="fas fa-music" />
        <span>Library</span>
      </NavLink>

      <NavLink to="/albums" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
        <i className="fas fa-compact-disc" />
        <span>Albums</span>
      </NavLink>

      <NavLink to="/favorites" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
        <i className="fas fa-heart" />
        <span>Saved</span>
      </NavLink>

      {(isAdmin || isUser) && (
        <NavLink to={showAdminPanel ? '/admin' : '/library'} className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <i className={showAdminPanel ? 'fas fa-cog' : 'fas fa-user'} />
          <span>{showAdminPanel ? 'Admin' : 'You'}</span>
        </NavLink>
      )}
    </nav>
  );
}

/* ─── Compact mobile audio player strip ─────────────────── */
function MobilePlayerBar({ currentAudio, onNext, onPrev, onClose }) {
  const {
    isPlaying,
    setIsPlaying,
    progress,
    currentTime,
    duration,
    seek,
    repeatMode,
    cycleRepeat,
    isShuffle,
    toggleShuffle,
    toggleFavorite,
    userFavorites,
  } = useAudio();

  const isFav = userFavorites.includes(currentAudio?._id);
  const [isSeeking, setIsSeeking] = useState(false);

  const getImg = () => {
    if (!currentAudio) return '/placeholder.png';
    const img = currentAudio.imageUrl || currentAudio.image;
    if (!img) return '/placeholder.png';
    return resolveUrl(img) || '/placeholder.png';
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (clientX, target) => {
    const rect = target.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    seek(pct);
  };

  useEffect(() => {
    if (!isSeeking) return undefined;
    const handleMove = (event) => {
      const progressEl = document.querySelector('.mobile-player-progress-container');
      if (progressEl) handleSeek(event.clientX, progressEl);
    };
    const handleUp = () => setIsSeeking(false);

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
  }, [isSeeking]);

  return (
    <div className="mobile-player-bar">
      {/* 1. Song Information */}
      <div className="mobile-player-song-info">
        <img
          src={getImg()}
          alt={currentAudio?.title || 'Now playing'}
          className="mobile-player-thumb"
          onError={e => { e.target.src = '/placeholder.png'; }}
        />
        <div className="mobile-player-meta">
          <div className="mobile-player-title">
            <span className="mobile-player-title-text">{currentAudio?.title}</span>
          </div>
          <div className="mobile-player-artist">{currentAudio?.speaker || 'Unknown'}</div>
        </div>
        <div className="mobile-player-status">
          {isPlaying ? (
            <div className="status-playing-indicator">
              <span />
              <span />
              <span />
            </div>
          ) : (
            <span className="status-paused-indicator">Paused</span>
          )}
        </div>
      </div>

      {/* 2. Seek Bar */}
      <div
        className="mobile-player-progress-container"
        onPointerDown={(e) => {
          setIsSeeking(true);
          handleSeek(e.clientX, e.currentTarget);
        }}
        style={{ cursor: 'pointer', touchAction: 'none' }}
      >
        <div className="mobile-player-progress-bg">
          <div className="mobile-player-progress-fill" style={{ width: `${progress}%` }} />
          <div className="mobile-player-progress-handle" style={{ left: `${progress}%` }} />
        </div>
      </div>

      {/* 3. Current Time — Duration */}
      <div className="mobile-player-timestamps">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* 4. Previous • Play/Pause • Next */}
      <div className="mobile-player-controls-row">
        <button className="mobile-player-btn mobile-player-prev" onClick={onPrev} aria-label="Previous track">
          <i className="fas fa-step-backward" />
        </button>
        <button
          className="mobile-player-btn mobile-player-play-pause"
          onClick={() => setIsPlaying(p => !p)}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <i className={isPlaying ? 'fas fa-pause' : 'fas fa-play'} />
        </button>
        <button className="mobile-player-btn mobile-player-next" onClick={onNext} aria-label="Next track">
          <i className="fas fa-step-forward" />
        </button>
      </div>

      {/* 5. Repeat • Shuffle • Like • Additional Controls */}
      <div className="mobile-player-actions-row">
        <button
          className={`mobile-action-btn mobile-repeat-btn ${repeatMode !== 'none' ? 'active' : ''}`}
          onClick={cycleRepeat}
          aria-label="Cycle repeat mode"
          style={{ position: 'relative' }}
        >
          <i className="fas fa-redo" />
          {repeatMode === 'one' && <span className="repeat-one-badge">1</span>}
          {repeatMode === 'all' && <span className="repeat-one-badge" style={{ fontSize: '7px', padding: '1px 3px' }}>∞</span>}
        </button>

        <button
          className={`mobile-action-btn mobile-shuffle-btn ${isShuffle ? 'active' : ''}`}
          onClick={toggleShuffle}
          aria-label="Toggle shuffle"
        >
          <i className="fas fa-random" />
        </button>

        <button
          className={`mobile-action-btn mobile-favorite-btn ${isFav ? 'active' : ''}`}
          onClick={toggleFavorite}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <i className={isFav ? 'fas fa-heart' : 'far fa-heart'} />
        </button>

        <button className="mobile-action-btn mobile-close-btn" onClick={onClose} aria-label="Close player">
          <i className="fas fa-times" />
        </button>
      </div>
    </div>
  );
}

/* ─── Main Layout ────────────────────────────────────────── */
export default function Layout() {
  const { currentAudio, setCurrentAudio, playNext, playPrev } = useAudio();
  const { isAdmin, isUser, isOnlyUser } = useAuth();
  const [searchQuery, setSearchQuery]     = useState('');
  const [isUploadOpen, setIsUploadOpen]   = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [uploadRefresh, setUploadRefresh] = useState(0);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Viewport tracking
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);


  const showSidebar    = !isMobile && (isAdmin || isUser) && sidebarOpen;
  const sidebarWidth   = 260;
  const TOPBAR_HEIGHT  = isMobile ? 64 : 72;
  const PLAYER_HEIGHT  = 88;
  const BOTTOM_NAV_H   = 68;

  return (
    <div className="app-shell">

      {/* Admin sidebar — desktop only */}
      {showSidebar && (
        <Sidebar onOpenUpload={() => setIsUploadOpen(true)} />
      )}

      {/* Main content area */}
      <div
        className={`mobile-page-wrapper layout-shell${currentAudio && isMobile ? ' player-active' : ''}`}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: showSidebar ? sidebarWidth : 0,
          minWidth: 0,
          paddingTop: isMobile ? TOPBAR_HEIGHT : 0,
          paddingBottom: isMobile
            ? (currentAudio ? BOTTOM_NAV_H + 180 + 16 : BOTTOM_NAV_H + 8)
            : (currentAudio ? PLAYER_HEIGHT + 16 : 0),
          transition: 'margin-left 0.25s ease',
        }}
      >
        <Header
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          onVoiceResult={(text) => setSearchQuery(text)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <FeedbackMarquee />

        {/* Page content */}
        <div
          className="layout-main-content"
        >
          <Outlet context={{ searchQuery, setSearchQuery, isUploadOpen, setIsUploadOpen, uploadRefresh }} />
        </div>
      </div>

      {/* ── DESKTOP: persistent bottom audio player ── */}
      {currentAudio && !isMobile && (
        <div
          className="desktop-player-bar"
          style={{
            position: 'fixed',
            bottom: 0,
            left: showSidebar ? sidebarWidth : 0,
            width: showSidebar ? `calc(100% - ${sidebarWidth}px)` : '100%',
            height: PLAYER_HEIGHT,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 100,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
            transition: 'left 0.25s ease, width 0.25s ease',
          }}
        >
          <AudioPlayer
            currentAudio={currentAudio}
            onNext={playNext}
            onPrev={playPrev}
            onClose={() => setCurrentAudio(null)}
          />
        </div>
      )}

      {/* ── MOBILE: compact player strip above bottom nav ── */}
      {currentAudio && isMobile && (
        <MobilePlayerBar
          currentAudio={currentAudio}
          onNext={playNext}
          onPrev={playPrev}
          onClose={() => setCurrentAudio(null)}
        />
      )}

      {/* ── MOBILE: bottom navigation ── */}
      <MobileBottomNav isAdmin={isAdmin} isUser={isUser} isOnlyUser={isOnlyUser} />

      {/* Upload modal */}
      <UploadAudioModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => setUploadRefresh(n => n + 1)}
      />
    </div>
  );
}
