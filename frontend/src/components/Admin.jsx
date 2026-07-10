import React, { useState, useEffect, useRef } from 'react';
import api, { resolveUrl } from '../api';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import UsersManagement from './UsersManagement';
import AlbumsManagement from './AlbumsManagement';
import FeedbackManagement from './FeedbackManagement';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function Admin() {
  const { token, isAdmin, hasPermission, hasAnyPermission } = useAuth();
  const { setIsUploadOpen, uploadRefresh } = useOutletContext();
  const navigate = useNavigate();

  const [selectedAudioIds, setSelectedAudioIds] = useState([]);
  const [showAlbumFromSelectionModal, setShowAlbumFromSelectionModal] = useState(false);
  const [newAlbumData, setNewAlbumData] = useState({
    albumName: '',
    title: '',
    description: '',
    coverImage: '',
    coverImagePreview: '',
    categoryId: '',
    isUploadingCover: false,
    newCategoryName: '',
    isNewCategory: false
  });
  const [loading, setLoading] = useState(true);
  const [audios, setAudios] = useState([]);
  const [editingAudio, setEditingAudio] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', speaker: '', duration: '', albumIds: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [categoryCoverFile, setCategoryCoverFile] = useState(null);
  const [categoryCoverPreview, setCategoryCoverPreview] = useState(null);
  const [editCoverFile, setEditCoverFile] = useState(null);
  const [editCoverPreview, setEditCoverPreview] = useState(null);
  const [editAudioCoverFile, setAudioCoverFile] = useState(null);
  const [editAudioCoverPreview, setAudioCoverPreview] = useState(null);
  const [addingCategory, setAddingCategory] = useState(false);
  // Key to force remount AlbumsManagement after category creation for fresh categories
  const [albumRefreshKey, setAlbumRefreshKey] = useState(0);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryTarget, setGalleryTarget] = useState(null);
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('library');
  const [filterExt, setFilterExt] = useState('');
  const [filterCat, setFilterCat] = useState('');

  // Get unique extensions from audios (fallback: extract from URL for old data)
  // Render Admin panel for all logged-in users; feature restrictions handled via tabs
  const getExt = (audio) => {
    if (audio.originalExtension) return audio.originalExtension.toLowerCase();
    if (audio.fileExtension) return audio.fileExtension.toLowerCase();
    if (audio.audioUrl) {
      const dot = audio.audioUrl.lastIndexOf('.');
      return dot > -1 ? audio.audioUrl.slice(dot + 1).toLowerCase() : 'mp3';
    }
    return 'mp3';
  };
  const uniqueExts = [...new Set(audios.map(getExt))].sort();

  // Redirect unauthenticated users only
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  const authConfig = () => ({
    headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories', authConfig());
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchAlbums = async () => {
    try {
      const res = await api.get('/albums', authConfig());
      setAlbums(res.data);
    } catch (err) {
      console.error('Failed to fetch albums for admin', err);
    }
  };

  const fetchAudios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audios');
      setAudios(res.data);
    } catch (err) {
      console.error('Failed to fetch audios for admin', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudios();
    fetchCategories();
    fetchAlbums();
  }, [uploadRefresh]);

  useEffect(() => {
    if (showGallery) {
      api.get('/gallery', authConfig())
        .then(res => setGalleryImages(res.data))
        .catch(err => console.error('Failed to load gallery images', err));
    }
  }, [showGallery]);

  const handleGalleryUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    api.post('/gallery/upload', formData, {
      headers: { ...authConfig().headers, 'Content-Type': 'multipart/form-data' },
    })
      .then(() => api.get('/gallery', authConfig()))
      .then(res => setGalleryImages(res.data))
      .catch(err => console.error('Gallery upload error', err));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this audio track? The file will be permanently removed.')) return;
    try {
      await api.delete(`/audios/${id}`, authConfig());
      setAudios(prev => prev.filter(a => a._id !== id));
      toast.success('Audio deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete audio');
    }
  };

  const startEdit = (audio) => {
    setEditingAudio(audio);
    setEditForm({
      title: audio.title,
      speaker: audio.speaker || '',
      duration: audio.duration || '',
      albumIds: audio.albumIds ? audio.albumIds.map(a => typeof a === 'string' ? a : a._id) : []
    });
    setAudioCoverFile(null);
    setAudioCoverPreview(audio.imageUrl || null);
  };



  const handleAlbumCheckboxChange = (albumId) => {
    setEditForm(prev => {
      const albumIds = prev.albumIds.includes(albumId)
        ? prev.albumIds.filter(id => id !== albumId)
        : [...prev.albumIds, albumId];
      return { ...prev, albumIds };
    });
  };

  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      let payload = editForm;
      let headers = authConfig().headers;
      
      if (editAudioCoverFile) {
        payload = new FormData();
        payload.append('title', editForm.title);
        payload.append('speaker', editForm.speaker);
        payload.append('duration', editForm.duration);
        payload.append('albumIds', JSON.stringify(editForm.albumIds));
        payload.append('imageFile', editAudioCoverFile);
        headers = { ...headers, 'Content-Type': 'multipart/form-data' };
      } else if (editAudioCoverPreview && !editAudioCoverPreview.startsWith('blob:') && editAudioCoverPreview !== editingAudio.imageUrl) {
        payload = { ...editForm, imageUrl: editAudioCoverPreview };
      }

      const res = await api.put(
        `/audios/${editingAudio._id}`,
        payload,
        { headers }
      );
      setAudios(prev => prev.map(a => a._id === editingAudio._id ? res.data : a));
      setEditingAudio(null);
      toast.success('Audio updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update audio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async () => {
  if (!newCategory.trim()) return;
  setAddingCategory(true);
  try {
    const token = localStorage.getItem('token');
    if (categoryCoverFile) {
      const formData = new FormData();
      formData.append('name', newCategory.trim());
      formData.append('coverImage', categoryCoverFile);
      await api.post('/categories', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
    } else {
      const payload = { name: newCategory.trim() };
      if (categoryCoverPreview && !categoryCoverPreview.startsWith('blob:')) {
        payload.coverImageUrl = categoryCoverPreview;
      }
      await api.post('/categories', payload, { headers: { Authorization: `Bearer ${token}` } });
    }
    // After successful addition, navigate to Albums tab and trigger refresh
    setActiveTab('albums');
    setAlbumRefreshKey(prev => prev + 1);
    setNewCategory('');
    setCategoryCoverFile(null);
    setCategoryCoverPreview(null);
    fetchCategories();
    window.dispatchEvent(new Event('categoriesUpdated'));
    toast.success('Category added');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to add category');
  } finally {
    setAddingCategory(false);
  }
};

  const handleModalCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setNewAlbumData(prev => ({ 
      ...prev, 
      coverImagePreview: localUrl, 
      isUploadingCover: true 
    }));

    const formData = new FormData();
    formData.append('images', file);

    try {
      const activeToken = token || localStorage.getItem('token');
      const res = await api.post('/gallery/upload', formData, {
        headers: { 
          Authorization: `Bearer ${activeToken}`, 
          'Content-Type': 'multipart/form-data' 
        },
      });
      const uploaded = Array.isArray(res.data) ? res.data[0] : res.data;
      const url = uploaded?.url || '';
      setNewAlbumData(prev => ({ 
        ...prev, 
        coverImage: url, 
        isUploadingCover: false 
      }));
      toast.success('Cover image uploaded successfully');
    } catch (err) {
      console.error('Modal cover upload error', err);
      toast.error('Failed to upload cover image');
      setNewAlbumData(prev => ({ 
        ...prev, 
        isUploadingCover: false, 
        coverImagePreview: '' 
      }));
    }
  };

  const closeAlbumModal = () => {
    setShowAlbumFromSelectionModal(false);
    setNewAlbumData({
      albumName: '',
      title: '',
      description: '',
      coverImage: '',
      coverImagePreview: '',
      categoryId: '',
      isUploadingCover: false,
      newCategoryName: '',
      isNewCategory: false
    });
  };

  const handleRenameCategory = async (catId) => {
    try {
      const token = localStorage.getItem('token');
      if (editCoverFile) {
        const formData = new FormData();
        formData.append('name', categoryName);
        formData.append('coverImage', editCoverFile);
        await api.patch(`/categories/${catId}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const payload = { name: categoryName.trim() };
        if (editCoverPreview && !editCoverPreview.startsWith('blob:')) {
          payload.coverImageUrl = editCoverPreview;
        }
        await api.patch(`/categories/${catId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setEditingCategory(null);
      setEditCoverFile(null);
      setEditCoverPreview(null);
      fetchCategories();
      toast.success('Category renamed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${catId}`, authConfig());
      fetchCategories();
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const totalTracks = audios.length;
  const totalFavorites = audios.filter(a => a.isFavorite).length;
  const totalCategories = categories.length;

  // Non-admin users can access admin panel (restricted features handled via tabs)

  // Define tabs based on user permissions
  const availableTabs = [];

  // Audio Library tab if has any audio permission
  if (isAdmin || hasAnyPermission(['audio_view', 'audio_upload', 'audio_edit', 'audio_delete'])) {
    availableTabs.push({ id: 'library', label: 'Audio Library', icon: 'fas fa-music' });
  }

  // Categories tab if has any category permission
  if (isAdmin || hasAnyPermission(['category_view', 'category_create', 'category_edit', 'category_delete'])) {
    availableTabs.push({ id: 'categories', label: 'Categories', icon: 'fas fa-tags' });
  }

  // Albums tab if has any album permission
  if (isAdmin || hasAnyPermission(['album_view', 'album_create', 'album_edit', 'album_delete'])) {
    availableTabs.push({ id: 'albums', label: 'Albums', icon: 'fas fa-photo-video' });
  }

  // Feedback tab if has any feedback permission
  if (isAdmin || hasAnyPermission(['feedback_view', 'feedback_delete'])) {
    availableTabs.push({ id: 'feedback', label: 'Feedback Management', icon: 'fas fa-comment-alt' });
  }

  // Analytics tab if has analytics permission
  if (isAdmin || hasPermission('analytics_view')) {
    availableTabs.push({ id: 'analytics', label: 'Analytics Dashboard', icon: 'fas fa-chart-bar' });
  }

  // Only admin sees Users tab
  if (isAdmin) {
    availableTabs.push({ id: 'users', label: 'Users', icon: 'fas fa-users' });
  }

  // Default to first available tab or library if no tabs
  const defaultTab = availableTabs.length > 0 ? availableTabs[0].id : 'library';
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/')}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
          >
            <i className="fas fa-arrow-left"></i>
            Back to Home
          </button>
          <div>
            <h2 className="admin-page-title">Admin Control Panel</h2>
            <p className="admin-page-sub">Manage audio library, categories, and metadata.</p>
          </div>
        </div>
        {(isAdmin || hasPermission('audio_upload')) && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="admin-upload-btn"
          >
            <i className="fas fa-cloud-upload-alt"></i>
            Upload Audio
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#fff4e6', color: '#f7a84d' }}>
            <i className="fas fa-music"></i>
          </div>
          <div>
            <p className="admin-stat-label">Total Tracks</p>
            <p className="admin-stat-value">{totalTracks}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#fff5f5', color: '#e53e3e' }}>
            <i className="fas fa-heart"></i>
          </div>
          <div>
            <p className="admin-stat-label">Favorites</p>
            <p className="admin-stat-value">{totalFavorites}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#f0fff4', color: '#38a169' }}>
            <i className="fas fa-tags"></i>
          </div>
          <div>
            <p className="admin-stat-label">Categories</p>
            <p className="admin-stat-value">{totalCategories}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#ebf8ff', color: '#3182ce' }}>
            <i className="fas fa-user-shield"></i>
          </div>
          <div>
            <p className="admin-stat-label">Admin</p>
            <p className="admin-stat-value" style={{ fontSize: '0.85rem' }}>Active</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {availableTabs.length > 0 && (
        <div className="admin-tabs">
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>
      )}

       {/* Users Tab */}
       {activeTab === 'users' && isAdmin && <UsersManagement />}

       {/* Albums Tab */}
       {activeTab === 'albums' && <AlbumsManagement key={albumRefreshKey} />}

       {/* Feedback Tab */}
       {activeTab === 'feedback' && <FeedbackManagement />}

       {/* Analytics Tab */}
       {activeTab === 'analytics' && <AnalyticsDashboard />}

       {/* Library Tab */}
       {activeTab === 'library' && (
         <div className="admin-panel">
          <div className="admin-panel-header">
            <span className="admin-panel-title">
              <i className="fas fa-list"></i> Library Catalog
            </span>
            <span className="admin-panel-count">{totalTracks} tracks</span>
          </div>

          {/* Extension + Category filter row */}
          {audios.length > 0 && (
            <div className="admin-filter-row">
              <select
                className="filter-select"
                value={filterExt}
                onChange={e => setFilterExt(e.target.value)}
                style={{ maxWidth: 150 }}
              >
                <option value="">All Formats</option>
                {uniqueExts.map(ext => (
                  <option key={ext} value={ext}>{`.${ext.toUpperCase()}`}</option>
                ))}
              </select>
              <select
                className="filter-select"
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
                style={{ maxWidth: 180 }}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
              {(filterExt || filterCat) && (
                <button className="filter-chip" onClick={() => { setFilterExt(''); setFilterCat(''); }}>
                  <i className="fas fa-times" /> Clear
                </button>
              )}
              <span className="admin-filter-summary">
                Showing {audios.filter(a => {
                  const ext = getExt(a);
                  const matchExt = !filterExt || ext === filterExt;
                  const matchCat = !filterCat || a.category === filterCat;
                  return matchExt && matchCat;
                }).length} tracks
              </span>
            </div>
          )}

          {selectedAudioIds.length > 0 && (
            <div className="admin-bulk-actions">
              <span>{selectedAudioIds.length} selected</span>
              <button className="btn-primary" onClick={() => setShowAlbumFromSelectionModal(true)}>
                Create Album from Selected
              </button>
            </div>
          )}
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
              <p>Loading audio library...</p>
            </div>
          ) : audios.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><i className="fas fa-folder-open"></i></div>
              <p className="empty-title">No Audio Tracks</p>
              <p className="empty-desc">Upload your first audio file to get started.</p>
              <button className="btn-primary" onClick={() => setIsUploadOpen(true)}>
                <i className="fas fa-plus"></i> Upload Now
              </button>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}>
                      <input
                        type="checkbox"
                        checked={selectedAudioIds.length === audios.length && audios.length > 0}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedAudioIds(audios.map(a => a._id));
                          } else {
                            setSelectedAudioIds([]);
                          }
                        }}
                      />
                    </th>
                    <th>Title</th>
                    <th>Speaker</th>
                    <th>Albums</th>
                    <th>Format</th>
                    <th>Duration</th>
                    <th>Uploaded</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {audios
                    .filter(a => {
                      const ext = getExt(a);
                      const matchExt = !filterExt || ext === filterExt;
                      const matchCat = !filterCat || a.category === filterCat;
                      return matchExt && matchCat;
                    })
                    .map(audio => (
                    <tr key={audio._id}>
                      <td>
                         <input
                           type="checkbox"
                           checked={selectedAudioIds.includes(audio._id)}
                           onChange={e => {
                             if (e.target.checked) {
                               setSelectedAudioIds(prev => [...prev, audio._id]);
                             } else {
                               setSelectedAudioIds(prev => prev.filter(id => id !== audio._id));
                             }
                           }}
                         />
                      </td>
                      <td>
                        <div className="admin-audio-cell">
                          <img
                            src={
                              audio.imageUrl
                                ? resolveUrl(audio.imageUrl)
                                : '/placeholder.png'
                            }
                            alt=""
                            className="admin-audio-thumb"
                          />
                          <div className="admin-audio-info">
                            <p className="admin-audio-name">{audio.title}</p>
                            <a
                              href={audio.audioUrl ? resolveUrl(audio.audioUrl) : '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-audio-link"
                              onClick={e => e.stopPropagation()}
                            >
                              <i className="fas fa-external-link-alt"></i> File URL
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="admin-td-muted">{audio.speaker || '—'}</td>
                      <td>
                        {audio.albumIds && audio.albumIds.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {audio.albumIds.map(album => (
                              <span key={album._id || album} className="admin-cat-badge">{album.title || album.name || album}</span>
                            ))}
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className={`ext-badge ext-badge--${getExt(audio)}`}>
                            .{getExt(audio)}
                          </span>
                          {getExt(audio) !== 'mp3' && (
                            <span style={{ fontSize: '0.72rem', color: '#718096' }}>
                              Converted to mp3 for playback
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="admin-td-mono">{audio.duration || '0:00'}</td>
                      <td className="admin-td-muted admin-td-date">
                        {audio.date || (audio.createdAt ? new Date(audio.createdAt).toLocaleDateString() : '—')}
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn edit"
                            onClick={() => startEdit(audio)}
                            title="Edit Metadata"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="admin-action-btn delete"
                            onClick={() => handleDelete(audio._id)}
                            title="Delete Audio"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="admin-panel">
          <div className="admin-panel-header">
            <span className="admin-panel-title">
              <i className="fas fa-tags"></i> Category Management
            </span>
            <span className="admin-panel-count">{totalCategories} categories</span>
          </div>

          {/* Add New Category */}
    <div className="form-group admin-add-cat">
  <input
    type="text"
    placeholder="New category name..."
    className="admin-cat-input"
    value={newCategory}
    onChange={e => setNewCategory(e.target.value)}
    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
    style={{ marginBottom: '8px', width: '100%' }}
  />
  {categoryCoverPreview && (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
      <img src={resolveUrl(categoryCoverPreview)} alt="Preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
      <button className="btn-ghost" onClick={() => { setCategoryCoverFile(null); setCategoryCoverPreview(null); }} style={{ fontSize: '0.8rem' }}>Remove</button>
    </div>
  )}
  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
    <button className="btn-ghost" onClick={() => { setGalleryTarget('add'); setShowGallery(true); }} style={{ fontSize: '0.8rem' }}>
      <i className="fas fa-images"></i> From Gallery
    </button>
    <button className="btn-ghost" onClick={() => document.getElementById('add-cat-pc').click()} style={{ fontSize: '0.8rem' }}>
      <i className="fas fa-desktop"></i> From PC
    </button>
  </div>
  <input
    id="add-cat-pc"
    type="file"
    accept="image/*"
    className="sr-only"
    onChange={e => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith('image/')) {
        setCategoryCoverFile(file);
        setCategoryCoverPreview(URL.createObjectURL(file));
      }
    }}
  />
  <button
    className="btn-primary"
    onClick={handleAddCategory}
    disabled={addingCategory || !newCategory.trim()}
    style={{ marginTop: '12px' }}
  >
    {addingCategory ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
    Add Category
  </button>
</div>

          {/* Category List */}
          {categories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><i className="fas fa-tags"></i></div>
              <p className="empty-title">No Categories Yet</p>
              <p className="empty-desc">Add your first category above.</p>
            </div>
          ) : (
            <ul className="admin-cat-list">
              {categories.map(cat => (
                <li key={cat._id} className="admin-cat-item">
                  {editingCategory && editingCategory._id === cat._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 8 }}>
                      <div className="admin-cat-edit-row">
                        <input
                          type="text"
                          className="admin-cat-input"
                          value={categoryName}
                          onChange={e => setCategoryName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleRenameCategory(cat._id)}
                          autoFocus
                        />
                        <button className="btn-primary" onClick={() => handleRenameCategory(cat._id)}>
                          Save
                        </button>
                        <button className="btn-ghost" onClick={() => setEditingCategory(null)}>
                          Cancel
                        </button>
                      </div>
                      <div className="admin-cat-edit-row">
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button className="btn-ghost" onClick={() => { setGalleryTarget('edit'); setShowGallery(true); }} style={{ fontSize: '0.8rem' }}>
                            <i className="fas fa-images"></i> From Gallery
                          </button>
                          <button className="btn-ghost" onClick={() => document.getElementById(`edit-cat-pc-${cat._id}`).click()} style={{ fontSize: '0.8rem' }}>
                            <i className="fas fa-desktop"></i> From PC
                          </button>
                        </div>
                        <input
                          id={`edit-cat-pc-${cat._id}`}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file && file.type.startsWith('image/')) {
                              setEditCoverFile(file);
                              setEditCoverPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                        {editCoverPreview && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img src={resolveUrl(editCoverPreview)} alt="Preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                            <button className="btn-ghost" onClick={() => { setEditCoverFile(null); setEditCoverPreview(null); }} style={{ fontSize: '0.8rem' }}>Remove</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="admin-cat-name" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {cat.coverImageUrl ? (
                          <img 
                            src={resolveUrl(cat.coverImageUrl)}
                            alt={cat.name} 
                            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} 
                          />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 4, background: 'var(--saffron-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-tags" style={{ color: 'var(--saffron)', fontSize: '0.9rem' }}></i>
                          </div>
                        )}
                        <span>{cat.name}</span>
                      </div>
                      <div className="admin-actions">
                        <button
                          className="admin-action-btn edit"
                          onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); setEditCoverFile(null); setEditCoverPreview(null); }}
                          title="Rename"
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                        <button
                          className="admin-action-btn delete"
                          onClick={() => handleDeleteCategory(cat._id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Create Album From Selected Modal */}
      {showAlbumFromSelectionModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Create Album from Selected Audios</h3>
              <button className="modal-close" onClick={closeAlbumModal}>
                <i className="fas fa-times" />
              </button>
            </div>
            <form
              className="modal-body"
              onSubmit={async e => {
                e.preventDefault();
                if (newAlbumData.isUploadingCover) {
                  toast.error('Please wait for the cover image to finish uploading.');
                  return;
                }
                const loadingToast = toast.loading('Creating album...');
                try {
                  const token = localStorage.getItem('token');
                  let finalCategoryId = newAlbumData.categoryId;

                  if (newAlbumData.isNewCategory) {
                    if (!newAlbumData.newCategoryName.trim()) {
                      toast.error('Please enter a category name', { id: loadingToast });
                      return;
                    }
                    const existingCat = categories.find(
                      c => c.name.toLowerCase() === newAlbumData.newCategoryName.trim().toLowerCase()
                    );
                    if (existingCat) {
                      finalCategoryId = existingCat._id;
                    } else {
                      const catRes = await api.post(
                        '/categories',
                        { name: newAlbumData.newCategoryName.trim() },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      finalCategoryId = catRes.data._id;
                      await fetchCategories();
                    }
                  }

                  if (!finalCategoryId) {
                    toast.error('Category is required', { id: loadingToast });
                    return;
                  }

                  const payload = {
                    albumName: newAlbumData.albumName,
                    title: newAlbumData.title || newAlbumData.albumName,
                    description: newAlbumData.description,
                    categoryId: finalCategoryId,
                    coverImage: newAlbumData.coverImage || '/album_placeholder.png',
                    audioIds: selectedAudioIds,
                  };

                  await api.post('/albums/from-selection', payload, {
                    headers: { Authorization: `Bearer ${token}` },
                  });

                  toast.success('Album created successfully', { id: loadingToast });
                  setSelectedAudioIds([]);
                  closeAlbumModal();
                  setAlbumRefreshKey(prev => prev + 1);
                  fetchAlbums();
                } catch (err) {
                  console.error(err);
                  toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to create album', { id: loadingToast });
                }
              }}
            >
              <div className="form-group">
                <label className="form-label">Album Name (required)</label>
                <input
                  type="text"
                  required
                  value={newAlbumData.albumName}
                  onChange={e => setNewAlbumData({ ...newAlbumData, albumName: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Title (optional)</label>
                <input
                  type="text"
                  value={newAlbumData.title}
                  onChange={e => setNewAlbumData({ ...newAlbumData, title: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  rows={3}
                  value={newAlbumData.description}
                  onChange={e => setNewAlbumData({ ...newAlbumData, description: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ width: '100%', marginBottom: '12px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Category (required)</label>
                <select
                  required
                  value={newAlbumData.isNewCategory ? 'NEW_CATEGORY' : newAlbumData.categoryId}
                  onChange={e => {
                    if (e.target.value === 'NEW_CATEGORY') {
                      setNewAlbumData(prev => ({ ...prev, isNewCategory: true, categoryId: '' }));
                    } else {
                      setNewAlbumData(prev => ({ ...prev, isNewCategory: false, categoryId: e.target.value }));
                    }
                  }}
                  className="form-input"
                  style={{ width: '100%', maxWidth: '300px' }}
                >
                  <option value="">Select Category</option>
                  <option value="NEW_CATEGORY">+ Create New Category...</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {newAlbumData.isNewCategory && (
                <div className="form-group" style={{ width: '100%', marginBottom: '12px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>New Category Name (required)</label>
                  <input
                    type="text"
                    required
                    value={newAlbumData.newCategoryName}
                    onChange={e => setNewAlbumData(prev => ({ ...prev, newCategoryName: e.target.value }))}
                    placeholder="Enter new category name..."
                    className="form-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Cover Image (optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleModalCoverUpload}
                  />
                  {newAlbumData.isUploadingCover && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <i className="fas fa-spinner fa-spin" /> Uploading image...
                    </span>
                  )}
                </div>
                {newAlbumData.coverImagePreview && (
                  <div style={{ marginTop: '8px' }}>
                    <img
                      src={newAlbumData.coverImagePreview}
                      alt="Cover Preview"
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={closeAlbumModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={newAlbumData.isUploadingCover}>
                  Create Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingAudio && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Edit Audio Track</h3>
              <button className="modal-close" onClick={() => setEditingAudio(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-body">
              {error && (
                <div className="modal-error">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="form-input"
                  placeholder="Audio title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Speaker</label>
                <input
                  type="text"
                  name="speaker"
                  required
                  value={editForm.speaker}
                  onChange={handleEditChange}
                  className="form-input"
                  placeholder="Speaker name"
                />
              </div>


              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>Albums (Select multiple)</label>
                <div style={{ maxHeight: 110, overflowY: 'auto', border: '1.5px solid var(--border)', borderRadius: 8, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, background: '#fff' }}>
                  {albums.map(album => (
                    <label key={album._id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                      <input
                        type="checkbox"
                        checked={editForm.albumIds?.includes(album._id)}
                        onChange={() => handleAlbumCheckboxChange(album._id)}
                        style={{ accentColor: 'var(--saffron)' }}
                      />
                      {album.title}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Duration</label>
                <input
                  type="text"
                  name="duration"
                  value={editForm.duration}
                  onChange={handleEditChange}
                  className="form-input"
                  placeholder="e.g. 12:34"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Cover Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" className="btn-ghost" onClick={() => { setGalleryTarget('editAudio'); setShowGallery(true); }} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    <i className="fas fa-images"></i> From Gallery
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => document.getElementById('edit-audio-pc').click()} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    <i className="fas fa-desktop"></i> From PC
                  </button>
                </div>
                <input
                  id="edit-audio-pc"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      setAudioCoverFile(file);
                      setAudioCoverPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {editAudioCoverPreview && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={resolveUrl(editAudioCoverPreview)} alt="Preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                    <button type="button" className="btn-ghost" onClick={() => { setAudioCoverFile(null); setAudioCoverPreview(null); }} style={{ fontSize: '0.8rem' }}>Remove</button>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingAudio(null)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? (
                    <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                  ) : (
                    <><i className="fas fa-check"></i> Save Changes</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Picker Modal */}
      {showGallery && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={() => setShowGallery(false)}>
          <div className="modal-box" style={{ maxWidth: '600px', background: '#fff', borderRadius: '12px', padding: '20px' }} onClick={e => e.stopPropagation()}>
            <h3>Select Cover Image</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {galleryImages.map((img, idx) => (
                <img
                  key={idx}
                  src={resolveUrl(img.url || img)}
                  alt={`gallery-${idx}`}
                  style={{ width: '100%', height: 150, objectFit: 'cover', cursor: 'pointer', border: '2px solid transparent' }}
                  onClick={() => {
                    if (galleryTarget === 'add') {
                      setCategoryCoverFile(null);
                      setCategoryCoverPreview(img.url);
                    } else if (galleryTarget === 'edit') {
                      setEditCoverFile(null);
                      setEditCoverPreview(img.url || img);
                    } else if (galleryTarget === 'editAudio') {
                      setAudioCoverFile(null);
                      setAudioCoverPreview(img.url || img);
                    }
                    setShowGallery(false);
                  }}
                />
              ))}
            </div>
            {/* Upload new images button */}
            <button onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    style={{ marginTop: '12px', marginRight: '8px', padding: '8px 16px', border: 'none', borderRadius: '6px', background: 'var(--saffron-dark)', color: '#fff', cursor: 'pointer' }}>
              Upload New Images
            </button>
            <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleGalleryUpload} />
            <button onClick={() => setShowGallery(false)} style={{ marginTop: '12px', padding: '8px 16px', border: 'none', borderRadius: '6px', background: 'var(--saffron)', color: '#fff', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}
