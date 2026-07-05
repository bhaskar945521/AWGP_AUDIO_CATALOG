import React, { useState, useEffect } from 'react';
import { useAudio, REPEAT_NONE, REPEAT_ONE, REPEAT_ALL } from '../context/AudioContext';
import { resolveUrl } from '../api';

/**
 * Desktop audio player UI — no <audio> element here,
 * playback is handled by the shared element in AudioContext.
 */
export default function AudioPlayer({ currentAudio, onNext, onPrev, onClose }) {
  const {
    isPlaying,
    setIsPlaying,
    repeatMode,
    cycleRepeat,
    progress,
    currentTime,
    duration,
    seek,
    audioRef,
  } = useAudio();

  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  // Sync volume to shared audio element
  useEffect(() => {
    const el = audioRef?.current;
    if (el) el.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted, audioRef]);

  const togglePlay   = () => setIsPlaying(p => !p);
  const toggleMute   = () => setIsMuted(m => !m);

  const handleVolumeChange = (e) => {
    setVolume(Number(e.target.value));
    setIsMuted(false);
  };

  const handleProgressChange = (e) => {
    const value = Number(e.target.value || 0);
    if (Number.isNaN(value)) return;
    const clamped = Math.max(0, Math.min(100, value));
    seek(clamped);
    if (!isPlaying) setIsPlaying(true);
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getImageSrc = () => {
    if (!currentAudio) return '/placeholder.png';
    const img = currentAudio.imageUrl || currentAudio.image;
    if (!img) return '/placeholder.png';
    return resolveUrl(img) || '/placeholder.png';
  };

  if (!currentAudio) return null;

  // ── Repeat button appearance ──────────────────────────────────
  const repeatLabel = repeatMode === REPEAT_ONE
    ? 'Repeat: One track'
    : repeatMode === REPEAT_ALL
    ? 'Repeat: All tracks'
    : 'Repeat: Off';

  const repeatIcon = repeatMode === REPEAT_ONE
    ? 'fas fa-redo'  // filled redo = repeat-one
    : 'fas fa-redo'; // same icon, different badge/style

  const repeatActive = repeatMode !== REPEAT_NONE;

  const volumeIcon =
    isMuted || volume === 0
      ? 'fas fa-volume-mute'
      : volume < 50
      ? 'fas fa-volume-down'
      : 'fas fa-volume-up';

  return (
    <>
      {/* Track info — LEFT */}
      <div className="player-track-info">
        <img
          src={getImageSrc()}
          alt={currentAudio.title}
          className="player-thumbnail"
          onError={e => { e.target.src = '/placeholder.png'; }}
        />
        <div className="player-meta">
          <h4 className="player-title">{currentAudio.title}</h4>
          <span className="player-speaker">{currentAudio.speaker || 'Unknown'}</span>
        </div>
      </div>

      {/* Controls — CENTER */}
      <div className="player-controls-container">
        <div className="player-buttons">
          <button className="control-btn" onClick={onPrev} title="Previous">
            <i className="fas fa-step-backward" />
          </button>
          <button
            className="control-btn play-pause-btn"
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            <i className={isPlaying ? 'fas fa-pause' : 'fas fa-play'} />
          </button>
          <button className="control-btn" onClick={onNext} title="Next">
            <i className="fas fa-step-forward" />
          </button>
        </div>
        <div className="player-progress-wrapper">
          <span className="time-display">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="progress-bar"
            value={progress}
            onInput={handleProgressChange}
            onChange={handleProgressChange}
            min="0"
            max="100"
            step="0.1"
          />
          <span className="time-display">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume + Repeat + Close — RIGHT */}
      <div className="player-actions">
        {/* 3-state repeat button */}
        <button
          className={`action-btn repeat-btn ${repeatMode !== REPEAT_NONE ? 'active' : ''} ${repeatMode === REPEAT_ONE ? 'repeat-one' : ''}`}
          onClick={cycleRepeat}
          title={repeatLabel}
          style={{ position: 'relative' }}
        >
          <i className={repeatIcon} />
          {/* "1" badge when repeat-one is active */}
          {repeatMode === REPEAT_ONE && (
            <span className="repeat-one-badge">1</span>
          )}
        </button>

        <button className="action-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
          <i className={volumeIcon} />
        </button>
        <input
          type="range"
          className="volume-bar"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          min="0"
          max="100"
          style={{ width: 80 }}
          title="Volume"
        />
        <button className="action-btn" onClick={onClose} title="Close player">
          <i className="fas fa-times" />
        </button>
      </div>
    </>
  );
}
