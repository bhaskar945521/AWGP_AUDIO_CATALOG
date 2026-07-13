import React, { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

/**
 * AddToAlbumModal
 * Props:
 *   audioId  — the audio to associate  (string)
 *   onClose  — close the modal
 *   onSuccess — optional callback after successful association
 */
export default function AddToAlbumModal({ audioId, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ── Load all categories on mount ── */
  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data || []))
      .catch(() => toast.error('Could not load categories'))
      .finally(() => setLoadingCats(false));
  }, []);

  /* ── Load albums when category changes ── */
  useEffect(() => {
    if (!selectedCatId) { setAlbums([]); setSelectedAlbumId(''); return; }
    setLoadingAlbums(true);
    setSelectedAlbumId('');
    api.get('/albums')
      .then(res => {
        const all = res.data || [];
        const filtered = all.filter(al => {
          const cid = typeof al.categoryId === 'string'
            ? al.categoryId
            : al.categoryId?._id;
          return cid === selectedCatId;
        });
        setAlbums(filtered);
      })
      .catch(() => toast.error('Could not load albums'))
      .finally(() => setLoadingAlbums(false));
  }, [selectedCatId]);

  const handleAssociate = async () => {
    if (!selectedAlbumId) { toast.error('Please select an album'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await api.patch(
        `/albums/${selectedAlbumId}/add-audios`,
        { audioIds: [audioId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Audio successfully added to album!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to associate audio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px'
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--card-bg, #1e1e2e)',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        borderRadius: '16px',
        padding: '28px 28px 24px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
              color: 'var(--saffron, #f7a84d)', textTransform: 'uppercase', marginBottom: 4
            }}>
              <i className="fas fa-folder-plus" style={{ marginRight: 6 }} />
              Add to Existing Album
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main, #fff)' }}>
              Associate Audio
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid var(--border, rgba(255,255,255,0.15))',
              borderRadius: '8px', color: 'var(--text-muted, #aaa)',
              width: 32, height: 32, cursor: 'pointer', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Step 1 — Category */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{
            display: 'block', fontSize: '0.8rem', fontWeight: 600,
            color: 'var(--text-muted, #aaa)', marginBottom: '8px', letterSpacing: '0.04em'
          }}>
            <i className="fas fa-tag" style={{ marginRight: 6, color: 'var(--saffron, #f7a84d)' }} />
            Step 1 — Choose Category
          </label>
          {loadingCats ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading categories…</div>
          ) : (
            <select
              value={selectedCatId}
              onChange={e => setSelectedCatId(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--input-bg, rgba(255,255,255,0.06))',
                border: `1px solid ${selectedCatId ? 'var(--saffron, #f7a84d)' : 'var(--border, rgba(255,255,255,0.15))'}`,
                borderRadius: '8px', color: 'var(--text-main, #fff)',
                fontSize: '0.9rem', cursor: 'pointer', outline: 'none',
                transition: 'border-color 0.2s'
              }}
            >
              <option value="">— Select a Category —</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Step 2 — Album (only shown after category is selected) */}
        {selectedCatId && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', fontSize: '0.8rem', fontWeight: 600,
              color: 'var(--text-muted, #aaa)', marginBottom: '8px', letterSpacing: '0.04em'
            }}>
              <i className="fas fa-compact-disc" style={{ marginRight: 6, color: 'var(--saffron, #f7a84d)' }} />
              Step 2 — Choose Album
            </label>
            {loadingAlbums ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading albums…</div>
            ) : albums.length === 0 ? (
              <div style={{
                padding: '14px', borderRadius: '8px', textAlign: 'center',
                border: '1px dashed var(--border, rgba(255,255,255,0.15))',
                color: 'var(--text-muted, #aaa)', fontSize: '0.85rem'
              }}>
                <i className="fas fa-inbox" style={{ marginRight: 6 }} />
                No albums found in this category
              </div>
            ) : (
              <select
                value={selectedAlbumId}
                onChange={e => setSelectedAlbumId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px',
                  background: 'var(--input-bg, rgba(255,255,255,0.06))',
                  border: `1px solid ${selectedAlbumId ? 'var(--saffron, #f7a84d)' : 'var(--border, rgba(255,255,255,0.15))'}`,
                  borderRadius: '8px', color: 'var(--text-main, #fff)',
                  fontSize: '0.9rem', cursor: 'pointer', outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              >
                <option value="">— Select an Album —</option>
                {albums.map(al => (
                  <option key={al._id} value={al._id}>{al.title || al.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Progress indicator */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: '20px', alignItems: 'center'
        }}>
          <div style={{
            height: 3, flex: 1, borderRadius: 3,
            background: selectedCatId ? 'var(--saffron, #f7a84d)' : 'var(--border, rgba(255,255,255,0.1))',
            transition: 'background 0.3s'
          }} />
          <div style={{
            height: 3, flex: 1, borderRadius: 3,
            background: selectedAlbumId ? 'var(--saffron, #f7a84d)' : 'var(--border, rgba(255,255,255,0.1))',
            transition: 'background 0.3s'
          }} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: '8px', cursor: 'pointer',
              background: 'transparent',
              border: '1px solid var(--border, rgba(255,255,255,0.15))',
              color: 'var(--text-muted, #aaa)', fontSize: '0.9rem', fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAssociate}
            disabled={!selectedAlbumId || saving}
            style={{
              padding: '9px 22px', borderRadius: '8px', cursor: selectedAlbumId && !saving ? 'pointer' : 'not-allowed',
              background: selectedAlbumId && !saving
                ? 'linear-gradient(135deg, var(--saffron, #f7a84d), #e8933a)'
                : 'rgba(247,168,77,0.3)',
              border: 'none', color: '#fff',
              fontSize: '0.9rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s'
            }}
          >
            {saving
              ? <><i className="fas fa-spinner fa-spin" /> Associating…</>
              : <><i className="fas fa-link" /> Associate</>}
          </button>
        </div>
      </div>
    </div>
  );
}
