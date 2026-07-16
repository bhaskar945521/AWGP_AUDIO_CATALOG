import React, { useState, useEffect, useRef } from 'react';
import api, { resolveUrl } from '../api';
import PreviewAlbum from './PreviewAlbum';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Albums Management for Admin panel
export default function AlbumsManagement() {
  const { token, isAdmin, hasPermission } = useAuth();
  const authConfig = () => ({ headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` } });

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [audios, setAudios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [newAlbum, setNewAlbum] = useState({ name: '', title: '', description: '', coverImage: '' });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editAlbum, setEditAlbum] = useState({ name: '', title: '', description: '', coverImage: '' });
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryCover, setNewCategoryCover] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [selectedAudioIds, setSelectedAudioIds] = useState([]);
  const [editAudioIds, setEditAudioIds] = useState([]);

  // States for associating selected audios (existing vs new album)
  const [formMode, setFormMode] = useState('create'); // 'create' or 'existing'
  const [existingCategoryId, setExistingCategoryId] = useState('');
  const [existingAlbumId, setExistingAlbumId] = useState('');


  // States for filtering the audios list
  const [audioSearchQuery, setAudioSearchQuery] = useState('');
  const [audioCategoryFilter, setAudioCategoryFilter] = useState('');
  const [audioAlbumFilter, setAudioAlbumFilter] = useState('');

  const [editAudioSearchQuery, setEditAudioSearchQuery] = useState('');
  const [editAudioCategoryFilter, setEditAudioCategoryFilter] = useState('');
  const [editAudioAlbumFilter, setEditAudioAlbumFilter] = useState('');

  // Filter computation for Create form audio checklist
  const filteredAudiosForSelection = audios.filter(a => {
    if (audioSearchQuery && !a.title?.toLowerCase().includes(audioSearchQuery.toLowerCase())) {
      return false;
    }
    if (audioAlbumFilter) {
      const isInAlbum = a.albumIds?.some(al => (al._id || al) === audioAlbumFilter);
      if (!isInAlbum) return false;
    }
    if (audioCategoryFilter) {
      const isInCategory = a.albumIds?.some(al => {
        const catId = al.categoryId && typeof al.categoryId === 'object' ? al.categoryId._id : al.categoryId;
        return catId === audioCategoryFilter;
      });
      if (!isInCategory) return false;
    }
    return true;
  });

  // Filter computation for Edit modal audio checklist
  const filteredEditAudiosForSelection = audios.filter(a => {
    if (editAudioSearchQuery && !a.title?.toLowerCase().includes(editAudioSearchQuery.toLowerCase())) {
      return false;
    }
    if (editAudioAlbumFilter) {
      const isInAlbum = a.albumIds?.some(al => (al._id || al) === editAudioAlbumFilter);
      if (!isInAlbum) return false;
    }
    if (editAudioCategoryFilter) {
      const isInCategory = a.albumIds?.some(al => {
        const catId = al.categoryId && typeof al.categoryId === 'object' ? al.categoryId._id : al.categoryId;
        return catId === editAudioCategoryFilter;
      });
      if (!isInCategory) return false;
    }
    return true;
  });
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateFromSelection, setShowCreateFromSelection] = useState(false);
  const fileInputRef = useRef(null);
  const coverFileRef = useRef(null);
  const categoryCoverFileRef = useRef(null);
  const editCoverFileRef = useRef(null);

  const canBuildAlbum = !creating && newAlbum.name.trim() && newAlbum.title.trim() && (selectedCategoryId || newCategoryName.trim());
  const previewAlbumData = {
    ...newAlbum,
    categoryId: selectedCategoryId || (newCategoryName ? { name: newCategoryName.trim() } : '')
  };

  // Fetch data
  const fetchAlbums = async () => {
    try {
      const res = await api.get('/albums', authConfig());
      setAlbums(res.data);
    } catch (err) {
      console.error('Failed to fetch albums', err);
      toast.error('Unable to load albums');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories', authConfig());
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchAudios = async () => {
    try {
      const res = await api.get('/audios', authConfig());
      setAudios(res.data);
    } catch (err) {
      console.error('Failed to fetch audios', err);
    }
  };

  useEffect(() => {
    fetchAlbums();
    fetchCategories();
    fetchAudios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter albums when search term changes
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredAlbums(albums);
    } else {
      setFilteredAlbums(
        albums.filter(a =>
          (a.name && a.name.toLowerCase().includes(term)) ||
          (a.title && a.title.toLowerCase().includes(term)) ||
          (a.speaker && a.speaker.toLowerCase().includes(term))
        )
      );
    }
  }, [albums, searchTerm]);

  // State to hold optional edits for selected audios
  const [audioEdits, setAudioEdits] = useState({});

  // Open simple prompt dialogs to edit audio metadata (optional)
  const handleAudioEdit = audio => {
    const newTitle = window.prompt('Edit title (leave empty to keep unchanged):', audio.title || '');
    const newSpeaker = window.prompt('Edit speaker (leave empty to keep unchanged):', audio.speaker || '');
    const newDesc = window.prompt('Edit description (leave empty to keep unchanged):', audio.description || '');
    const newTags = window.prompt('Edit tags as comma‑separated list (leave empty to keep unchanged):', (audio.tags && audio.tags.join(',')) || '');
    setAudioEdits(prev => ({
      ...prev,
      [audio._id]: {
        ...(prev[audio._id] || {}),
        ...(newTitle ? { title: newTitle } : {}),
        ...(newSpeaker ? { speaker: newSpeaker } : {}),
        ...(newDesc ? { description: newDesc } : {}),
        ...(newTags ? { tags: newTags.split(',').map(t => t.trim()).filter(t => t) } : {})
      }
    }));
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewAlbum(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async e => {
    e.preventDefault();
    setCreating(true);

    if (formMode === 'existing') {
      if (!existingAlbumId) {
        toast.error('Please select an existing album');
        setCreating(false);
        return;
      }
      if (selectedAudioIds.length === 0) {
        toast.error('Please select at least one audio track');
        setCreating(false);
        return;
      }

      const loadingToast = toast.loading('Adding to existing album...');
      try {
        await api.patch(
          `/albums/${existingAlbumId}/add-audios`,
          {
            audioIds: selectedAudioIds,
            audioUpdates: Object.entries(audioEdits)
              .filter(([, upd]) => Object.keys(upd).length)
              .map(([audioId, upd]) => ({ audioId, ...upd }))
          },
          authConfig()
        );

        toast.success('Audios added to album successfully', { id: loadingToast });
        setSelectedAudioIds([]);
        setAudioEdits({});
        setExistingCategoryId('');
        setExistingAlbumId('');
        fetchAlbums();
      } catch (err) {
        toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to add to album', { id: loadingToast });
        console.error('Add to album error', err);
      } finally {
        setCreating(false);
      }
      return;
    }

    const loadingToast = toast.loading('Creating album...');

    try {
      let finalCategoryId = selectedCategoryId;

      if (isNewCategory) {
        if (!newCategoryName.trim()) {
          toast.error('Enter a new category name', { id: loadingToast });
          setCreating(false);
          return;
        }

        const existingCat = categories.find(
          c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
        );
        if (existingCat) {
          finalCategoryId = existingCat._id;
        } else {
          const catRes = await api.post(
            '/categories',
            { name: newCategoryName.trim(), coverImageUrl: newCategoryCover },
            authConfig()
          );
          finalCategoryId = catRes.data._id;
          await fetchCategories();
        }
      }

      if (!finalCategoryId) {
        toast.error('Choose an existing category or create a new one', { id: loadingToast });
        setCreating(false);
        return;
      }

      await api.post(
        '/albums/from-selection-with-edits',
        {
          albumName: newAlbum.name,
          title: newAlbum.title,
          description: newAlbum.description,
          coverImage: newAlbum.coverImage,
          categoryId: finalCategoryId,
          audioIds: selectedAudioIds,
          audioUpdates: Object.entries(audioEdits)
            .filter(([, upd]) => Object.keys(upd).length)
            .map(([audioId, upd]) => ({ audioId, ...upd }))
        },
        authConfig()
      );

      toast.success('Album created', { id: loadingToast });
      setNewAlbum({ name: '', title: '', description: '', coverImage: '' });
      setSelectedCategoryId('');
      setIsNewCategory(false);
      setNewCategoryName('');
      setNewCategoryCover('');
      setSelectedAudioIds([]);
      setAudioEdits({});
      fetchAlbums();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to create album', { id: loadingToast });
      console.error('Create album error', err);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = album => {
    setEditingId(album._id);
    setEditAlbum({ name: album.name || '', title: album.title || '', description: album.description || '', coverImage: album.coverImage || '' });
    setEditCategoryId(album.categoryId ? (album.categoryId._id || album.categoryId) : '');
    setEditAudioIds(album.audioIds ? album.audioIds.map(a => (a._id ? a._id : a)) : []);
  };

  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditAlbum(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    try {
      await api.put(
        `/albums/${editingId}`,
        { ...editAlbum, categoryId: editCategoryId, audioIds: editAudioIds },
        authConfig()
      );
      toast.success('Album updated');
      setEditingId(null);
      fetchAlbums();
    } catch (err) {
      console.error('Update album error', err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update album');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this album? This cannot be undone.')) return;
    try {
      await api.delete(`/albums/${id}`, authConfig());
      toast.success('Album deleted');
      fetchAlbums();
    } catch (err) {
      console.error('Delete album error', err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to delete album');
    }
  };

  const handleCoverUpload = e => {
    const file = e.target.files[0];
    if (!file) return;

    // Set local object URL immediately for instant preview
    const localUrl = URL.createObjectURL(file);
    setNewAlbum(prev => ({ ...prev, coverImage: localUrl }));

    const formData = new FormData();
    formData.append('images', file);
    api.post('/gallery/upload', formData, {
      headers: { ...authConfig().headers, 'Content-Type': 'multipart/form-data' },
    })
      .then(res => {
        const uploaded = Array.isArray(res.data) ? res.data[0] : res.data;
        const url = uploaded?.url || '';
        setNewAlbum(prev => ({ ...prev, coverImage: url }));
        toast.success('Cover image uploaded successfully');
      })
      .catch(err => {
        console.error('Cover upload error', err);
        toast.error('Failed to upload cover image');
      });
  };

  const handleEditCoverUpload = e => {
    const file = e.target.files[0];
    if (!file) return;

    // Set local object URL immediately for instant preview
    const localUrl = URL.createObjectURL(file);
    setEditAlbum(prev => ({ ...prev, coverImage: localUrl }));

    const formData = new FormData();
    formData.append('images', file);
    api.post('/gallery/upload', formData, {
      headers: { ...authConfig().headers, 'Content-Type': 'multipart/form-data' },
    })
      .then(res => {
        const uploaded = Array.isArray(res.data) ? res.data[0] : res.data;
        const url = uploaded?.url || '';
        setEditAlbum(prev => ({ ...prev, coverImage: url }));
        toast.success('Cover image uploaded successfully');
      })
      .catch(err => {
        console.error('Cover upload error', err);
        toast.error('Failed to upload cover image');
      });
  };

  // Handle category cover image upload (for new category creation)
  const handleCategoryCoverUpload = e => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setNewCategoryCover(localUrl);

    const formData = new FormData();
    formData.append('images', file);
    api.post('/gallery/upload', formData, {
      headers: { ...authConfig().headers, 'Content-Type': 'multipart/form-data' },
    })
      .then(res => {
        const uploaded = Array.isArray(res.data) ? res.data[0] : res.data;
        setNewCategoryCover(uploaded?.url || '');
        toast.success('Category cover uploaded successfully');
      })
      .catch(err => {
        console.error('Category cover upload error', err);
        toast.error('Failed to upload category cover');
      });
  };

  // UI Rendering
  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <span className="admin-panel-title"><i className="fas fa-photo-video" /> Album Management</span>
        <span className="admin-panel-count">{albums.length} albums</span>
      </div>

      {/* Create / Associate Form */}
      <form className="admin-add-album" onSubmit={handleCreate} style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '20px', background: 'var(--saffron-pale)', borderRadius: '12px', border: '1px solid var(--border-saffron)', width: '100%' }}>
        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(247,168,77,0.15)', paddingBottom: '10px', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={() => setFormMode('create')}
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: formMode === 'create' ? 'var(--saffron)' : 'transparent',
              color: formMode === 'create' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            <i className="fas fa-plus-circle" style={{ marginRight: 6 }} />
            Create New Album
          </button>
          <button
            type="button"
            onClick={() => setFormMode('existing')}
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: formMode === 'existing' ? 'var(--saffron)' : 'transparent',
              color: formMode === 'existing' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            <i className="fas fa-folder-plus" style={{ marginRight: 6 }} />
            Add to Existing Album
          </button>
        </div>

        {formMode === 'create' ? (
          <>
            {/* Create New Album Fields */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%', alignItems: 'center' }}>
              <input type="text" name="name" placeholder="Slug / ID" className="admin-input" style={{ flex: 1, minWidth: '120px' }} value={newAlbum.name} onChange={handleInputChange} required />
              <input type="text" name="title" placeholder="Title" className="admin-input" style={{ flex: 1, minWidth: '150px' }} value={newAlbum.title} onChange={handleInputChange} required />
              <input type="text" name="description" placeholder="Description" className="admin-input" style={{ flex: 1.5, minWidth: '200px' }} value={newAlbum.description} onChange={handleInputChange} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button type="button" className="admin-input" onClick={() => coverFileRef.current && coverFileRef.current.click()}>Upload Cover Image</button>
                {newAlbum.coverImage && (
                  <img
                    src={resolveUrl(newAlbum.coverImage) || newAlbum.coverImage}
                    alt="cover preview"
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }}
                  />
                )}
              </div>
              <input type="file" accept="image/*" ref={coverFileRef} style={{ display: 'none' }} onChange={handleCoverUpload} />
            </div>
            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="categoryType"
                    checked={!isNewCategory}
                    onChange={() => {
                      setIsNewCategory(false);
                      setNewCategoryName('');
                      setNewCategoryCover('');
                    }}
                  />
                  Use existing category
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="categoryType"
                    checked={isNewCategory}
                    onChange={() => {
                      setIsNewCategory(true);
                      setSelectedCategoryId('');
                    }}
                  />
                  Create new category
                </label>
              </div>

              {!isNewCategory ? (
                <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="admin-input" style={{ width: '100%', maxWidth: '320px' }} required>
                  <option value="">-- Choose existing category --</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '320px' }}>
                  <input
                    type="text"
                    placeholder="New category name"
                    className="admin-input"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button type="button" className="admin-input" onClick={() => categoryCoverFileRef.current && categoryCoverFileRef.current.click()}>Upload Category Cover (Optional)</button>
                    {newCategoryCover && (
                      <img
                        src={resolveUrl(newCategoryCover) || newCategoryCover}
                        alt="category cover preview"
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }}
                      />
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={categoryCoverFileRef} style={{ display: 'none' }} onChange={handleCategoryCoverUpload} />
                </div>
              )}
            </div>
          </>
        ) : (
          /* Existing Album Mode Fields */
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Choose Category</label>
              <select
                value={existingCategoryId}
                onChange={e => {
                  setExistingCategoryId(e.target.value);
                  setExistingAlbumId('');
                }}
                className="admin-input"
                style={{ width: '100%' }}
                required
              >
                <option value="">-- Choose Category --</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Choose Existing Album</label>
              <select
                value={existingAlbumId}
                onChange={e => setExistingAlbumId(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
                disabled={!existingCategoryId}
                required
              >
                <option value="">-- Select Album --</option>
                {albums
                  .filter(al => {
                    const cid = al.categoryId && typeof al.categoryId === 'object' ? al.categoryId._id : al.categoryId;
                    return cid === existingCategoryId;
                  })
                  .map(al => (
                    <option key={al._id} value={al._id}>{al.title || al.name}</option>
                  ))}
              </select>
            </div>
          </div>
        )}

        <div style={{ width: '100%', marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Select Audios to Associate:</label>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search audios..."
              value={audioSearchQuery}
              onChange={e => setAudioSearchQuery(e.target.value)}
              className="admin-input"
              style={{ flex: 1, minWidth: '130px', padding: '4px 8px', fontSize: '0.8rem' }}
            />
            <select
              value={audioCategoryFilter}
              onChange={e => {
                setAudioCategoryFilter(e.target.value);
                setAudioAlbumFilter('');
              }}
              className="admin-input"
              style={{ flex: 1, minWidth: '130px', padding: '4px 8px', fontSize: '0.8rem' }}
            >
              <option value="">-- All Categories --</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={audioAlbumFilter}
              onChange={e => setAudioAlbumFilter(e.target.value)}
              className="admin-input"
              style={{ flex: 1, minWidth: '130px', padding: '4px 8px', fontSize: '0.8rem' }}
            >
              <option value="">-- All Albums --</option>
              {albums
                .filter(al => {
                  if (!audioCategoryFilter) return true;
                  const catId = al.categoryId && typeof al.categoryId === 'object' ? al.categoryId._id : al.categoryId;
                  return catId === audioCategoryFilter;
                })
                .map(album => (
                  <option key={album._id} value={album._id}>{album.title || album.name}</option>
                ))}
            </select>
          </div>

          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', background: '#fff' }}>
            {filteredAudiosForSelection.map(a => (
              <label key={a._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" value={a._id} checked={selectedAudioIds.includes(a._id)}
                  onChange={e => {
                    const id = e.target.value;
                    setSelectedAudioIds(prev => e.target.checked ? [...prev, id] : prev.filter(v => v !== id));
                  }}
                  style={{ accentColor: 'var(--saffron)' }}
                />
                <span style={{ marginLeft: '8px', color: 'var(--text-main)' }}>{a.title || a._id}</span>
                {a.speaker && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>({a.speaker})</span>}
                {/* Optional Edit button */}
                <button type="button" onClick={() => handleAudioEdit(a)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer' }} title="Edit metadata (optional)">Edit</button>
              </label>
            ))}
            {filteredAudiosForSelection.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '12px', fontSize: '0.82rem' }}>No audios match the current filter</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {selectedAudioIds.length} audio{selectedAudioIds.length === 1 ? '' : 's'} selected
          </span>
          {formMode === 'create' ? (
            <>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  if (canBuildAlbum) setShowPreview(true);
                  else toast.error('Fill album name, title and category first');
                }}
                disabled={!canBuildAlbum}
              >
                <i className="fas fa-eye" /> Preview
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!canBuildAlbum || creating || !(isAdmin || hasPermission('albums_create'))}
                style={{ opacity: !(isAdmin || hasPermission('albums_create')) ? 0.5 : 1, cursor: !(isAdmin || hasPermission('albums_create')) ? 'not-allowed' : 'pointer' }}
                title={!(isAdmin || hasPermission('albums_create')) ? 'Create disabled (insufficient permission)' : ''}
              >
                {creating ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-plus" /> Create Album</>}
              </button>
            </>
          ) : (
            <button
              type="submit"
              className="btn-primary"
              disabled={!existingAlbumId || selectedAudioIds.length === 0 || creating || !(isAdmin || hasPermission('albums_update'))}
              style={{ opacity: !(isAdmin || hasPermission('albums_update')) ? 0.5 : 1, cursor: !(isAdmin || hasPermission('albums_update')) ? 'not-allowed' : 'pointer' }}
              title={!(isAdmin || hasPermission('albums_update')) ? 'Save disabled (insufficient permission)' : ''}
            >
              {creating ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-save" /> Save Changes</>}
            </button>
          )}
        </div>
       </form>

      {/* Search Input */}
      <input type="text" placeholder="Search albums..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="admin-input" style={{ marginBottom: '1rem', width: '100%', maxWidth: '300px' }} />

      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /> Loading albums...</div>
      ) : filteredAlbums.length === 0 ? (
        <div className="empty-state"><p className="empty-title">No albums found.</p></div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Title</th>
                <th>Category</th>
                <th>Cover</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlbums.map(album => (
                <tr key={album._id}>
                  <td>{album.name}</td>
                  <td>{album.title}</td>
                  <td>{album.categoryId && album.categoryId.name ? album.categoryId.name : (album.categoryId ? album.categoryId : '—')}</td>
                  <td>{album.coverImage ? (<img src={resolveUrl(album.coverImage) || album.coverImage} alt="cover" className="admin-album-thumb" style={{ width: 40, height: 40, objectFit: 'cover' }} />) : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="admin-action-btn edit"
                      onClick={() => (isAdmin || hasPermission('albums_update')) && startEdit(album)}
                      disabled={!(isAdmin || hasPermission('albums_update'))}
                      style={{ opacity: !(isAdmin || hasPermission('albums_update')) ? 0.4 : 1, cursor: !(isAdmin || hasPermission('albums_update')) ? 'not-allowed' : 'pointer' }}
                      title={!(isAdmin || hasPermission('albums_update')) ? 'Edit disabled (insufficient permission)' : 'Edit Album'}
                    ><i className="fas fa-edit" /></button>
                    <button
                      className="admin-action-btn delete"
                      onClick={() => (isAdmin || hasPermission('albums_delete')) && handleDelete(album._id)}
                      disabled={!(isAdmin || hasPermission('albums_delete'))}
                      style={{ opacity: !(isAdmin || hasPermission('albums_delete')) ? 0.4 : 1, cursor: !(isAdmin || hasPermission('albums_delete')) ? 'not-allowed' : 'pointer' }}
                      title={!(isAdmin || hasPermission('albums_delete')) ? 'Delete disabled (insufficient permission)' : 'Delete Album'}
                    ><i className="fas fa-trash-alt" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewAlbum album={previewAlbumData} categories={categories} onClose={() => setShowPreview(false)} />
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h3 className="modal-title">Edit Album</h3>
              <button className="modal-close" onClick={() => setEditingId(null)}><i className="fas fa-times" /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                <div className="form-group">
                  <label className="form-label">Slug / ID</label>
                  <input type="text" name="name" className="form-input" value={editAlbum.name} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input type="text" name="title" className="form-input" value={editAlbum.title} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Select Category</label>
                  <select value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)} className="form-input" required>
                    <option value="">-- Choose Category --</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Attach Audios (optional)</label>
                  
                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Search audios..."
                      value={editAudioSearchQuery}
                      onChange={e => setEditAudioSearchQuery(e.target.value)}
                      className="form-input"
                      style={{ flex: 1, minWidth: '120px', padding: '4px 8px', fontSize: '0.8rem' }}
                    />
                    <select
                      value={editAudioCategoryFilter}
                      onChange={e => {
                        setEditAudioCategoryFilter(e.target.value);
                        setEditAudioAlbumFilter('');
                      }}
                      className="form-input"
                      style={{ flex: 1, minWidth: '120px', padding: '4px 8px', fontSize: '0.8rem' }}
                    >
                      <option value="">-- All Categories --</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    <select
                      value={editAudioAlbumFilter}
                      onChange={e => setEditAudioAlbumFilter(e.target.value)}
                      className="form-input"
                      style={{ flex: 1, minWidth: '120px', padding: '4px 8px', fontSize: '0.8rem' }}
                    >
                      <option value="">-- All Albums --</option>
                      {albums
                        .filter(al => {
                          if (!editAudioCategoryFilter) return true;
                          const catId = al.categoryId && typeof al.categoryId === 'object' ? al.categoryId._id : al.categoryId;
                          return catId === editAudioCategoryFilter;
                        })
                        .map(album => (
                          <option key={album._id} value={album._id}>{album.title || album.name}</option>
                        ))}
                    </select>
                  </div>

                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', background: '#fff' }}>
                    {filteredEditAudiosForSelection.map(a => (
                      <label key={a._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input type="checkbox" value={a._id} checked={editAudioIds.includes(a._id)}
                          onChange={e => {
                            const id = e.target.value;
                            setEditAudioIds(prev => e.target.checked ? [...prev, id] : prev.filter(v => v !== id));
                          }}
                          style={{ accentColor: 'var(--saffron)' }}
                        />
                        <span style={{ marginLeft: '8px', color: 'var(--text-main)' }}>{a.title || a._id}</span>
                        {a.speaker && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>({a.speaker})</span>}
                      </label>
                    ))}
                    {filteredEditAudiosForSelection.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '12px', fontSize: '0.82rem' }}>No audios match the current filter</div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input type="text" name="description" className="form-input" value={editAlbum.description} onChange={handleEditChange} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" className="admin-input" onClick={() => editCoverFileRef.current && editCoverFileRef.current.click()}>Upload Cover Image</button>
                  {editAlbum.coverImage && (
                    <img
                      src={resolveUrl(editAlbum.coverImage) || editAlbum.coverImage}
                      alt="cover preview"
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                  )}
                  <input type="file" accept="image/*" ref={editCoverFileRef} style={{ display: 'none' }} onChange={handleEditCoverUpload} />
                </div>
              </div>
              <div className="modal-footer" style={{ flexShrink: 0, marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!(isAdmin || hasPermission('albums_update'))}
                  style={{ opacity: !(isAdmin || hasPermission('albums_update')) ? 0.5 : 1, cursor: !(isAdmin || hasPermission('albums_update')) ? 'not-allowed' : 'pointer' }}
                  title={!(isAdmin || hasPermission('albums_update')) ? 'Save disabled (insufficient permission)' : ''}
                >Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
