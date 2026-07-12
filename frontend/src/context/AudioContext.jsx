import React, {
  createContext, useContext, useState,
  useRef, useEffect, useCallback
} from 'react';
import api, { resolveUrl } from '../api';
import { useAuth } from './AuthContext';

const AudioContext = createContext();

// ── Repeat modes ────────────────────────────────────────────────
// 'none'   – stop after queue ends
// 'one'    – loop the current track indefinitely
// 'all'    – loop the whole queue
export const REPEAT_NONE = 'none';
export const REPEAT_ONE  = 'one';
export const REPEAT_ALL  = 'all';


export const AudioProvider = ({ children }) => {
  const { token, role, isPublicUser } = useAuth();
  
  const [currentAudio, setCurrentAudioState] = useState(null);
  const [isPlaying,    setIsPlaying]          = useState(false);
  const [queue,        setQueue]              = useState([]);
  const [repeatMode,   setRepeatMode]         = useState(REPEAT_NONE);
  const [isShuffle,    setIsShuffle]          = useState(false);
  const [progress,     setProgress]           = useState(0);
  const [currentTime,  setCurrentTime]        = useState(0);
  const [duration,     setDuration]           = useState(0);

  // User-specific favorites state
  const [userFavorites, setUserFavorites] = useState([]);
  // User reactions state (map audioId to {liked, disliked, likeCount, dislikeCount})
  const [userReactions, setUserReactions] = useState({});

  // Listening session tracking refs
  const sessionIdRef = useRef(null);
  const sessionStartRef = useRef(null);

  // Single shared <audio> element — always mounted, all devices
  const audioRef = useRef(null);

  // Keep a ref to the latest queue + currentAudio + repeatMode
  // so event handlers never see stale closure values
  const queueRef        = useRef(queue);
  const currentAudioRef = useRef(currentAudio);
  const repeatModeRef   = useRef(repeatMode);
  const isPlayingRef    = useRef(isPlaying);
  const isShuffleRef    = useRef(isShuffle);

  useEffect(() => { queueRef.current        = queue;        }, [queue]);
  useEffect(() => { currentAudioRef.current = currentAudio; }, [currentAudio]);
  useEffect(() => { repeatModeRef.current   = repeatMode;   }, [repeatMode]);
  useEffect(() => { isPlayingRef.current    = isPlaying;    }, [isPlaying]);
  useEffect(() => { isShuffleRef.current    = isShuffle;    }, [isShuffle]);

  // Fetch user-specific favorites on mount or login
  useEffect(() => {
    if (token) {
      api.get('/user/favorites')
        .then(res => {
          const list = res.data.data || res.data;
          setUserFavorites(list.map(a => a._id));
        })
        .catch(err => console.warn('[AudioContext] Failed to load favorites:', err));
    } else {
      setUserFavorites([]);
    }
  }, [token]);

  // ─── Listening Session Tracking (works everywhere) ───────────────
  useEffect(() => {
    if (!token || !currentAudio) {
      // If no token or no audio, end any existing session
      if (sessionIdRef.current && sessionStartRef.current) {
        const durationListened = Math.round((Date.now() - sessionStartRef.current) / 1000);
        api.patch(`/listening/${sessionIdRef.current}/end`, { durationListened }).catch(() => {});
        sessionIdRef.current = null;
        sessionStartRef.current = null;
      }
      return;
    }

    if (isPlaying && !sessionIdRef.current) {
      // Start new session
      api.post('/listening/start', { audioId: currentAudio._id })
        .then(res => {
          sessionIdRef.current = res.data.sessionId;
          sessionStartRef.current = Date.now();
        })
        .catch(() => {});
    } else if (!isPlaying && sessionIdRef.current) {
      // End session when paused
      const durationListened = sessionStartRef.current
        ? Math.round((Date.now() - sessionStartRef.current) / 1000)
        : 0;
      api.patch(`/listening/${sessionIdRef.current}/end`, { durationListened })
        .catch(() => {});
      sessionIdRef.current = null;
      sessionStartRef.current = null;
    }
  }, [isPlaying, currentAudio, token]);

  // ─── Cleanup: End session on unmount ────────────────────────────
  useEffect(() => {
    return () => {
      if (sessionIdRef.current && sessionStartRef.current) {
        const durationListened = Math.round((Date.now() - sessionStartRef.current) / 1000);
        api.patch(`/listening/${sessionIdRef.current}/end`, { durationListened }).catch(() => {});
      }
    };
  }, []);

  // ── When track changes: load new src only if URL differs ────────────────────────
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (!currentAudio || !currentAudio.audioUrl) {
      el.pause();
      el.removeAttribute('src');
      el.load();
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const newSrc = currentAudio.audioUrl;
    // Only reset source if the URL actually changed to avoid restarting playback
    if (el.src !== newSrc) {
      // Pause before replacing the source to avoid interrupting a pending play() call.
      el.pause();
      el.src = newSrc;
      el.load();
    }
  }, [currentAudio]);

  // ── Sync play / pause state ──────────────────────────────────
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !currentAudio) return;

    if (isPlaying) {
      const tryPlay = () => {
        el.play().catch((err) => {
          console.warn('[AudioContext] play() blocked:', err.message);
          setIsPlaying(false);
        });
      };
      if (el.readyState >= 2) {
        tryPlay();
      } else {
        el.addEventListener('canplay', tryPlay, { once: true });
      }
    } else {
      el.pause();
    }
  }, [isPlaying, currentAudio]);

  // ── Sync repeat-one loop flag ────────────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = repeatMode === REPEAT_ONE;
    }
  }, [repeatMode]);

  // ── Time update ──────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const cur = el.currentTime;
    const dur = el.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);
    setProgress(dur > 0 ? (cur / dur) * 100 : 0);
  }, []);

  // ── Public: set current audio (formats URLs idempotently) ────
  const setCurrentAudio = useCallback((audio, autoPlay = true) => {
    if (!audio || !audio.audioUrl) {
      setCurrentAudioState(null);
      setIsPlaying(false);
      return;
    }
    const formatted = {
      ...audio,
      audioUrl: resolveUrl(audio.audioUrl),
      image: audio.image
        ? (audio.image.startsWith('/') ? resolveUrl(audio.image) : audio.image)
        : resolveUrl(audio.imageUrl) || '/placeholder.png',
    };
    setCurrentAudioState(formatted);
    setIsPlaying(autoPlay);
  }, []);

  // ── Track ended ──────────────────────────────────────────────
  const handleEnded = useCallback(() => {
    const mode = repeatModeRef.current;

    if (mode === REPEAT_ONE) {
      // loop=true handles this natively; nothing to do
      return;
    }

    const q   = queueRef.current;
    const cur = currentAudioRef.current;

    if (q.length === 0 || !cur) {
      setIsPlaying(false);
      return;
    }

    if (isShuffleRef.current) {
      const otherTracks = q.filter(a => a._id !== cur._id);
      if (otherTracks.length > 0) {
        const randomTrack = otherTracks[Math.floor(Math.random() * otherTracks.length)];
        setCurrentAudio(randomTrack);
        setIsPlaying(true);
        return;
      }
    }

    const idx = q.findIndex(a => a._id === cur._id);
    const isLastTrack = idx >= 0 && idx >= q.length - 1;

    if (mode === REPEAT_ALL) {
      const next = idx >= 0 && idx < q.length - 1 ? q[idx + 1] : q[0];
      setCurrentAudio(next);
      setIsPlaying(true);
      return;
    }

    // REPEAT_NONE — advance to next or stop
    if (idx >= 0 && idx < q.length - 1) {
      setCurrentAudio(q[idx + 1]);
      setIsPlaying(true);
      return;
    }

    // End of queue, no repeat
    setIsPlaying(false);
  }, [setCurrentAudio]);   // uses refs for fresh values and public setter

  // ── Seek ─────────────────────────────────────────────────────
  const seek = useCallback((pct) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    const time = (pct / 100) * el.duration;
    el.currentTime = time;
    setProgress(pct);
    setCurrentTime(time);
  }, []);

  // ── Navigation ───────────────────────────────────────────────
  const playNext = useCallback(() => {
    const q   = queueRef.current;
    const cur = currentAudioRef.current;
    if (!q.length || !cur) return;

    if (isShuffleRef.current) {
      const otherTracks = q.filter(a => a._id !== cur._id);
      if (otherTracks.length > 0) {
        const randomTrack = otherTracks[Math.floor(Math.random() * otherTracks.length)];
        setCurrentAudio(randomTrack);
        return;
      }
    }

    const idx = q.findIndex(a => a._id === cur._id);
    if (idx >= 0 && idx < q.length - 1) {
      setCurrentAudio(q[idx + 1]);
    }
  }, [setCurrentAudio]);

  const playPrev = useCallback(() => {
    const q   = queueRef.current;
    const cur = currentAudioRef.current;
    if (!q.length || !cur) return;
    const idx = q.findIndex(a => a._id === cur._id);
    if (idx > 0) {
      setCurrentAudio(q[idx - 1]);
    }
  }, [setCurrentAudio]);

  // ── Cycle repeat mode (none → one → all → none) ─────────────
  const cycleRepeat = useCallback(() => {
    setRepeatMode(m => {
      if (m === REPEAT_NONE) return REPEAT_ONE;
      if (m === REPEAT_ONE)  return REPEAT_ALL;
      return REPEAT_NONE;
    });
  }, []);

  // ── Toggle Shuffle ──────────────────────────────────────────
  const toggleShuffle = useCallback(() => {
    setIsShuffle(s => !s);
  }, []);

  // Toggle favorite by specific audio track ID (User-specific)
  const toggleFavoriteTrack = useCallback(async (audioId) => {
    if (!audioId) return;
    const isFav = userFavorites.includes(audioId);
    try {
      if (isFav) {
        await api.delete(`/audio/${audioId}/favorite`);
        setUserFavorites(prev => prev.filter(id => id !== audioId));
        if (currentAudioRef.current && currentAudioRef.current._id === audioId) {
          setCurrentAudioState(prev => prev ? { ...prev, isFavorite: false } : null);
        }
        // Update queue without recreating objects to avoid resetting playback
        // setQueue(prev => prev.map(a => a._id === audioId ? { ...a, isFavorite: false } : a));
      } else {
        await api.post(`/audio/${audioId}/favorite`);
        setUserFavorites(prev => [...prev, audioId]);
        if (currentAudioRef.current && currentAudioRef.current._id === audioId) {
          setCurrentAudioState(prev => prev ? { ...prev, isFavorite: true } : null);
        }
        // setQueue(prev => prev.map(a => a._id === audioId ? { ...a, isFavorite: true } : a));
      }
    } catch (err) {
      console.error('[AudioContext] Failed to toggle user-specific favorite:', err);
    }
  }, [userFavorites]);

  // Fetch reactions for an audio track
  const fetchReactions = useCallback(async (audioId) => {
    if (!audioId) return;
    try {
      const res = await api.get(`/audio/${audioId}/reactions`);
      setUserReactions(prev => ({ ...prev, [audioId]: res.data }));
    } catch (err) {
      console.error('[AudioContext] Failed to fetch reactions:', err);
    }
  }, []);

  // Toggle like for an audio track
  const toggleLike = useCallback(async (audioId) => {
    if (!audioId || !token) return;
    try {
      const res = await api.post(`/audio/${audioId}/like`);
      setUserReactions(prev => ({ ...prev, [audioId]: res.data }));
    } catch (err) {
      console.error('[AudioContext] Failed to toggle like:', err);
    }
  }, [token]);

  // Toggle dislike for an audio track
  const toggleDislike = useCallback(async (audioId) => {
    if (!audioId || !token) return;
    try {
      const res = await api.post(`/audio/${audioId}/dislike`);
      setUserReactions(prev => ({ ...prev, [audioId]: res.data }));
    } catch (err) {
      console.error('[AudioContext] Failed to toggle dislike:', err);
    }
  }, [token]);

  // ── Toggle Favorite (current audio) ─────────────────────────
  const toggleFavorite = useCallback(async () => {
    const cur = currentAudioRef.current;
    if (!cur) return;
    await toggleFavoriteTrack(cur._id);
  }, [toggleFavoriteTrack]);

  // legacy shim so older components using isRepeating / setIsRepeating still work
  const isRepeating    = repeatMode !== REPEAT_NONE;
  const setIsRepeating = (v) => setRepeatMode(v ? REPEAT_ONE : REPEAT_NONE);

  return (
    <AudioContext.Provider
      value={{
        currentAudio,
        setCurrentAudio,
        isPlaying,
        setIsPlaying,
        queue,
        setQueue,
        playNext,
        playPrev,
        // repeat
        repeatMode,
        setRepeatMode,
        cycleRepeat,
        isRepeating,
        setIsRepeating,
        // shuffle
        isShuffle,
        toggleShuffle,
        // favorite
        toggleFavorite,
        toggleFavoriteTrack,
        userFavorites,
        isPublicUser,
        // reactions
        userReactions,
        fetchReactions,
        toggleLike,
        toggleDislike,
        // progress
        progress,
        currentTime,
        duration,
        seek,
        audioRef,
      }}
    >
      {children}

      {/* ── Single shared audio element — always mounted ── */}
      <audio
        ref={audioRef}
        loop={repeatMode === REPEAT_ONE}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
        playsInline
        webkit-playsinline="true"
      />
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
