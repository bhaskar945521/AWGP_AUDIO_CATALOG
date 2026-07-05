import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

import { useAuth } from '../context/AuthContext';
import AlbumCard from './AlbumCard';
import toast from 'react-hot-toast';
import Footer from './Footer';

export default function Albums() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [audios, setAudios] = useState([]);
  const [categories, setCategories] = useState([]);
  const location = useLocation();
  const [filterCategoryId, setFilterCategoryId] = useState(null);
  const [albumSearch, setAlbumSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Update selected category from URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catId = params.get('category');
    setFilterCategoryId(catId);
  }, [location.search]);

  const activeCategoryName = categories.find(cat => cat._id === filterCategoryId || cat.name?.toLowerCase() === String(filterCategoryId)?.toLowerCase())?.name || '';

  // Admin form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const [selectedCategoryIdModal, setSelectedCategoryIdModal] = useState(null);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const [albumsRes, audiosRes, catsRes] = await Promise.all([
        api.get('/albums'),
        api.get('/audios'),
        api.get('/categories')
      ]);
      setAlbums(albumsRes.data);
      setAudios(audiosRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      toast.error('Failed to fetch albums');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const getAlbumAudioCount = (albumId) => {
    // Count audios that reference this album via the `albumIds` array
    return audios.filter(audio => Array.isArray(audio.albumIds) && audio.albumIds.includes(albumId)).length;
  };

  const openCreateModal = () => {
    setEditingAlbum(null);
    setName('');
    setTitle('');
    setDescription('');
    setCoverImage('');
    setSelectedCategoryIdModal(null);
    setModalOpen(true);
  };

  const openEditModal = (album, e) => {
    e.stopPropagation();
    setEditingAlbum(album);
    setName(album.name);
    setTitle(album.title);
    setDescription(album.description || '');
    setCoverImage(album.coverImage || '');
    setSelectedCategoryIdModal(album.categoryId || null);
    setModalOpen(true);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !title.trim()) {
      toast.error('Name and Title are required');
      return;
    }
    if (!selectedCategoryIdModal) {
      toast.error('Category selection is required');
      return;
    }

    try {
      const config = {};
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

    const payload = {
      name: name.trim(),
      title: title.trim(),
      description: description.trim(),
      coverImage: coverImage.trim() || '/album_placeholder.png',
      // Use the selected category as the required `categoryId`
      categoryId: selectedCategoryIdModal || null,
      // Optionally allow passing audioIds when creating from selection (not used here)
      audioIds: []
    };

      if (editingAlbum) {
        await api.put(`/albums/${editingAlbum._id}`, payload, config);
        toast.success('Album updated successfully');
      } else {
        await api.post('/albums', payload, config);
        toast.success('Album created successfully');
      }
      setModalOpen(false);
      fetchAlbums();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save album');
      console.error(err);
    }
  };

  const handleDelete = async (albumId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this album?')) return;

    try {
      const config = {};
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      await api.delete(`/albums/${albumId}`, config);
      toast.success('Album deleted successfully');
      fetchAlbums();
    } catch (err) {
      toast.error('Failed to delete album');
      console.error(err);
    }
  };

  const normalizedFilter = String(filterCategoryId || '').trim();
  const filteredAlbums = albums.filter(album => {
    const albumCategoryId = typeof album.categoryId === 'string'
      ? album.categoryId
      : album.categoryId?._id?.toString();
    const albumCategoryName = typeof album.categoryId === 'object'
      ? album.categoryId?.name || ''
      : '';

    const categoryMatches = !normalizedFilter ||
      albumCategoryId === normalizedFilter ||
      albumCategoryName.toLowerCase() === normalizedFilter.toLowerCase();

    if (!categoryMatches) return false;

    if (!albumSearch.trim()) return true;

    const needle = albumSearch.toLowerCase();
    return [album.title, album.name, album.description, albumCategoryName]
      .some(value => value && value.toLowerCase().includes(needle));
  });

  return (
    <div className="albums-page">
      <div className="section-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="hero-title" style={{ fontSize: '2rem', textAlign: 'left', marginBottom: 6 }}>
            {activeCategoryName ? `${activeCategoryName} Albums` : 'Spiritual Albums'}
          </h1>
          <p className="hero-subtitle" style={{ textAlign: 'left', margin: 0, fontSize: '0.9rem' }}>
            {activeCategoryName
              ? `Browse albums in the ${activeCategoryName} category.`
              : 'Explore curated sets of bhajans, discourses, pravachans, and spiritual compilations.'}
          </p>
        </div>
        {isAdmin && (
          <button className="hero-cta" onClick={openCreateModal} style={{ padding: '10px 20px', fontSize: '0.88rem' }}>
            <i className="fas fa-plus" /> Create Album
          </button>
        )}
      </div>

      <div className="albums-filters" style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 320px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="library-search-input"
            placeholder="Search albums"
            value={albumSearch}
            onChange={e => setAlbumSearch(e.target.value)}
            style={{ width: '100%', maxWidth: '100%' }}
          />
          {albumSearch && (
            <button
              type="button"
              className="btn-secondary"
              style={{ minWidth: 96 }}
              onClick={() => setAlbumSearch('')}
            >
              Clear
            </button>
          )}
        </div>
        {activeCategoryName && (
          <div style={{ color: 'var(--text-muted)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span>Filtered by category:</span>
            <strong>{activeCategoryName}</strong>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setFilterCategoryId(null);
                setAlbumSearch('');
                navigate('/albums');
              }}
              style={{ fontSize: '0.85rem' }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="search-spinner" /></div>
      ) : albums.length === 0 ? (
        <div className="empty-state" style={{ padding: '80px 0' }}>
          <div className="empty-icon"><i className="fas fa-compact-disc" style={{ fontSize: '3rem', color: 'var(--saffron)' }} /></div>
          <div className="empty-title">No albums found</div>
          <div className="empty-desc">Create albums to group spiritual audios.</div>
        </div>
      ) : (
        <div className="albums-grid">
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="add-album-card"
            >
              <i className="fas fa-plus-circle add-album-card__icon" />
              <span className="add-album-card__label">Create Album</span>
            </button>
          )}
          {filteredAlbums.map(album => (
  <AlbumCard
    key={album._id}
    name={album.name}
    title={album.title}
    description={album.description}
    coverImage={album.coverImage}
    count={getAlbumAudioCount(album._id)}
    onClick={() => navigate(`/albums/${album._id}`)}
    isAdmin={isAdmin}
    onEdit={(e) => { e.stopPropagation(); openEditModal(album, e); }}
    onDelete={(e) => { e.stopPropagation(); handleDelete(album._id, e); }}
  />
))}
        </div>
      )}

      {/* ── CREATE / EDIT ALBUM MODAL ── */}
      {modalOpen && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-box modal-box--wide">
            <div className="modal-header" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, padding: 0 }}>
                  <i className="fas fa-arrow-left" /> Back
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  {editingAlbum ? 'Edit Album' : 'Create New Album'}
                </h3>
                <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                  <i className="fas fa-times" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="upload-form">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>Album Slug / Name (unique, e.g. 'sandhya-kirtan')</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.9rem' }}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. sandhya-kirtan"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>Display Title</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.9rem' }}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Sandhya Kirtan & Bhajans"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>Description</label>
                <textarea
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.9rem', minHeight: 80, resize: 'vertical' }}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the collection..."
                />
              </div>

               <div className="form-group" style={{ marginBottom: 16 }}>
                 <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>Categories <span style={{ color: 'var(--saffron)' }}>*</span></label>
                 <div className="checkbox-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   {categories.map(cat => (
                     <label key={cat._id} style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                       <input
                         type="radio"
                         name="category"
                         value={cat._id}
                         checked={selectedCategoryIdModal === cat._id}
                         onChange={() => setSelectedCategoryIdModal(cat._id)}
                         style={{ marginRight: '6px' }}
                       />
                       {cat.name}
                     </label>
                   ))}
                 </div>
               </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>Cover Image URL (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.9rem' }}
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  placeholder="e.g. /uploads/images/cover.jpg or external url"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', background: 'none' }}>
                  Cancel
                </button>
                <button type="submit" className="hero-cta" style={{ padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                  {editingAlbum ? 'Save Changes' : 'Create Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
