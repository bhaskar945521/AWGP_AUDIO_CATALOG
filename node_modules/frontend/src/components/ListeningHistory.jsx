import React, { useEffect, useState } from 'react';
import api from '../api';
import AudioCard from './AudioCard';
import { useAudio } from '../context/AudioContext';
import toast from 'react-hot-toast';

export default function ListeningHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const { setCurrentAudio, setQueue, toggleFavoriteTrack } = useAudio();

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/user/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load listening history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0 sec';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins} min ${secs} sec`;
    return `${secs} sec`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const toggleFavorite = async (id) => {
    try {
      await toggleFavoriteTrack(id);
      // Refresh history to reflect favorite status (though not necessary, but nice)
      loadHistory();
    } catch (err) { console.error(err); }
  };

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your entire listening history?')) return;
    try {
      setClearing(true);
      await api.delete('/user/history');
      setHistory([]);
      toast.success('Listening history cleared successfully');
    } catch (err) {
      console.error('Failed to clear history', err);
      toast.error('Failed to clear history');
    } finally {
      setClearing(false);
    }
  };

  // Get unique audio tracks from history (remove duplicates, keep latest)
  const uniqueAudioMap = new Map();
  history.forEach(session => {
    if (session.audioId && !uniqueAudioMap.has(session.audioId._id)) {
      uniqueAudioMap.set(session.audioId._id, { ...session.audioId, lastListened: session.sessionStart, totalListened: session.durationListened });
    } else if (session.audioId) {
      const existing = uniqueAudioMap.get(session.audioId._id);
      uniqueAudioMap.set(session.audioId._id, { ...existing, totalListened: existing.totalListened + session.durationListened });
    }
  });
  const uniqueTracks = Array.from(uniqueAudioMap.values()).sort((a, b) => new Date(b.lastListened) - new Date(a.lastListened));

  return (
    <div>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
            Listening History
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Your recently played spiritual audio tracks (last 7 days).
          </p>
        </div>
        {uniqueTracks.length > 0 && (
          <button
            onClick={clearHistory}
            disabled={clearing}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #e53e3e',
              background: 'transparent', color: '#e53e3e', cursor: clearing ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: '0.85rem', opacity: clearing ? 0.6 : 1
            }}
          >
            {clearing ? 'Clearing...' : 'Clear History'}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid rgba(247,168,77,0.2)', borderTopColor: 'var(--saffron)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : uniqueTracks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="fas fa-history" /></div>
          <div className="empty-title">No listening history yet</div>
          <div className="empty-desc">
            Start playing audio tracks to build your listening history.
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'var(--saffron-pale)', border: '1px solid var(--saffron-border)', padding: '4px 12px', borderRadius: 99 }}>
              {uniqueTracks.length} unique {uniqueTracks.length === 1 ? 'track' : 'tracks'} played
            </span>
          </div>

          <div className="audios-grid">
            {uniqueTracks.map(audio => (
              <div key={audio._id} style={{ position: 'relative' }}>
                <AudioCard
                  {...audio}
                  onPlay={() => { setQueue(uniqueTracks); setCurrentAudio(audio); }}
                  onToggleFavorite={() => toggleFavorite(audio._id)}
                />
                <div style={{
                  position: 'absolute', bottom: 8, right: 8,
                  fontSize: '0.7rem', color: 'var(--text-muted)',
                  background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: 99
                }}>
                  Last: {formatDate(audio.lastListened)} • {formatDuration(audio.totalListened)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
