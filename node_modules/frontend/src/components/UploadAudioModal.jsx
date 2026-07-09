import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { resolveUrl } from '../api';

export default function UploadAudioModal({ isOpen, onClose, onUploadSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    speaker: '',
    duration: '',
    description: ''
  });

  // New state for categories and filtered albums
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [albumsList, setAlbumsList] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [selectedAlbumIds, setSelectedAlbumIds] = useState([]);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [newAlbumCoverImage, setNewAlbumCoverImage] = useState('');
  const [showAlbumGallery, setShowAlbumGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [tagsInput, setTagsInput] = useState('');

  const [categorySearch, setCategorySearch] = useState('');
  const [albumSearch, setAlbumSearch] = useState('');

  const [audioFile, setAudioFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const dropRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAlbumDropdownOpen, setIsAlbumDropdownOpen] = useState(false);

  const categoryDropdownRef = useRef(null);
  const albumDropdownRef = useRef(null);

  const lastFetchRef = useRef(0);

  const fetchInitialData = async (force = false) => {
    const now = Date.now();
    // Cache for 60 seconds
    if (!force && now - lastFetchRef.current < 60000 && albumsList.length > 0 && categories.length > 0) {
      return;
    }
    try {
      const [albumsRes, categoriesRes] = await Promise.all([
        api.get('/albums'),
        api.get('/categories')
      ]);
      setAlbumsList(albumsRes.data);
      setCategories(categoriesRes.data);
      lastFetchRef.current = Date.now();
    } catch (e) {
      console.error('Failed to load initial upload data', e);
    }
  };

  // Filter albums when a category is selected; show all when no category
  useEffect(() => {
    if (selectedCategoryId) {
      const filtered = albumsList.filter(a => {
        const catId = a.categoryId && typeof a.categoryId === 'object' ? a.categoryId._id : a.categoryId;
        return catId === selectedCategoryId;
      });
      setFilteredAlbums(filtered);
    } else {
      // Show all albums if no category is selected
      setFilteredAlbums(albumsList);
    }
  }, [selectedCategoryId, albumsList]);

  // Fetch gallery images when album cover selector opens
  useEffect(() => {
    if (showAlbumGallery) {
      api.get('/gallery')
        .then(res => setGalleryImages(res.data))
        .catch(err => console.error('Failed to load gallery images', err));
    }
  }, [showAlbumGallery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (albumDropdownRef.current && !albumDropdownRef.current.contains(event.target)) {
        setIsAlbumDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      // Reset form states
      setFormData({ title: '', speaker: '', duration: '', description: '' });
      setSelectedCategoryId('');
      setSelectedAlbumIds([]);
      setNewAlbumTitle('');
      setNewAlbumDescription('');
      setNewAlbumCoverImage('');
      setShowAlbumGallery(false);
      setGalleryImages([]);
      setTagsInput('');
      setCategorySearch('');
      setAlbumSearch('');
      setAudioFile(null);
      setImageFile(null);
      setImagePreview(null);
      setError('');
      setIsDuplicate(false);
      setDuplicateDetails(null);
      setIsCategoryDropdownOpen(false);
      setIsAlbumDropdownOpen(false);
      setIsSubmitting(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const extractDuration = (file) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      const totalSeconds = Math.floor(audio.duration);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, duration: formattedDuration }));
      URL.revokeObjectURL(url);
    };
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Audio file size exceeds the 50MB limit.');
        setAudioFile(null);
        return;
      }
      const validExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!validExtensions.includes(ext)) {
        setError('Invalid audio format. Allowed formats: MP3, WAV, OGG, M4A, FLAC, AAC, WMA');
        setAudioFile(null);
        return;
      }
      setAudioFile(file);
      extractDuration(file);
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Audio file size exceeds the 50MB limit.');
        return;
      }
      const validExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!validExtensions.includes(ext)) {
        setError('Invalid audio format. Allowed formats: MP3, WAV, OGG, M4A, FLAC, AAC, WMA');
        return;
      }
      setAudioFile(file);
      extractDuration(file);
      setError('');
    }
  };

  const getFileExt = (name) => {
    const dot = name.lastIndexOf('.');
    return dot > -1 ? name.slice(dot + 1).toUpperCase() : '?';
  };

  const handleAlbumCheckboxChange = (albumId) => {
    setSelectedAlbumIds(prev =>
      prev.includes(albumId) ? prev.filter(id => id !== albumId) : [...prev, albumId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!formData.speaker.trim()) {
      setError('Speaker is required.');
      return;
    }
    if (!selectedCategoryId) {
      setError('Please select a category first.');
      return;
    }
    if (selectedAlbumIds.length === 0) {
      setError('Please select at least one album.');
      return;
    }
    if (!audioFile) {
      setError('Please select an audio file.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setIsDuplicate(false);
    setUploadProgress(0);
    setUploadStatus('Uploading file: 0%');

    try {
      const token = localStorage.getItem('token');
      const uploadData = new FormData();
      uploadData.append('title', formData.title.trim());
      uploadData.append('speaker', formData.speaker.trim());
      uploadData.append('duration', formData.duration || '0:00');
      uploadData.append('description', formData.description.trim());
      uploadData.append('categoryId', selectedCategoryId);
      uploadData.append('albumIds', JSON.stringify(selectedAlbumIds));

      const tagList = tagsInput.split(',').map(s => s.trim()).filter(Boolean);
      uploadData.append('tags', JSON.stringify(tagList));
      uploadData.append('audioFile', audioFile);
      if (imageFile) {
        uploadData.append('imageFile', imageFile);
      }

      await api.post('/audios', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          if (percentCompleted < 100) {
            setUploadStatus(`Uploading file: ${percentCompleted}%`);
          } else {
            setUploadStatus('Processing audio (converting to MP3 and analyzing)...');
          }
        }
      });

      toast.success('Audio uploaded successfully!');
      setIsSubmitting(false);
      onUploadSuccess();
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 409) {
        setIsDuplicate(true);
        setDuplicateDetails({
          categories: data?.categories || [],
          albums: data?.albums || []
        });
        const msg = data?.existingTitle
          ? `This file already exists — "${data.existingTitle}" is already in the library.`
          : (data?.message || 'This audio file already exists.');
        setError(msg);
        toast.error(msg, { duration: 5000 });
      } else {
        setIsDuplicate(false);
        setDuplicateDetails(null);
        const msg = data?.message || err.message || 'Upload failed. Please try again.';
        setError(msg);
        toast.error(msg);
      }
    }
  };

  // UI Rendering
  return (
    <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="upload-modal-box" style={{ maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: 650, borderRadius: 16 }}>
        {/* Header */}
        <div className="upload-modal-header" style={{ padding: 24, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, width: '100%' }}>
            <button type="button" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, padding: 0 }}>
              <i className="fas fa-arrow-left" /> Back
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="upload-modal-header-icon">
              <i className="fas fa-cloud-upload-alt" />
            </div>
            <div className="upload-modal-header-text">
              <h2 className="upload-modal-title" style={{ margin: 0 }}>Upload Audio</h2>
              <p className="upload-modal-subtitle" style={{ margin: 0 }}>Add a new audio track to the catalog</p>
            </div>
          </div>
          <button onClick={onClose} className="upload-modal-close" style={{ position: 'absolute', top: 24, right: 24 }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="upload-modal-body" style={{ padding: '0 24px 24px 24px' }}>
          {error && (
            <div className={`upload-modal-error${isDuplicate ? ' upload-modal-error--duplicate' : ''}`} style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <i className={isDuplicate ? 'fas fa-copy' : 'fas fa-exclamation-circle'} />
                <span style={{ marginLeft: 8, fontWeight: 600 }}>{error}</span>
                <button type="button" onClick={() => { setError(''); setIsDuplicate(false); setDuplicateDetails(null); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                  <i className="fas fa-times" />
                </button>
              </div>
              {isDuplicate && duplicateDetails && (
                <div style={{ fontSize: '0.85rem', marginTop: 4, paddingLeft: 22, borderTop: '1px solid rgba(229, 62, 62, 0.2)', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4, color: 'inherit' }}>
                  {duplicateDetails.categories && duplicateDetails.categories.length > 0 && (
                    <div>
                      <strong>Existing Category:</strong> {duplicateDetails.categories.map(c => c.name).filter(Boolean).join(', ')}
                    </div>
                  )}
                  {duplicateDetails.albums && duplicateDetails.albums.length > 0 && (
                    <div>
                      <strong>Existing Albums:</strong> {duplicateDetails.albums.map(a => a.title).filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="upload-field" style={{ marginBottom: 16 }}>
            <label className="upload-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              <i className="fas fa-heading" style={{ marginRight: 6 }} /> Title <span className="upload-required">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="upload-input"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.9rem' }}
              placeholder="e.g. The Power of Meditation"
            />
          </div>

          {/* Speaker */}
          <div className="upload-field" style={{ marginBottom: 16 }}>
            <label className="upload-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              <i className="fas fa-microphone" style={{ marginRight: 6 }} /> Speaker <span className="upload-required">*</span>
            </label>
            <input
              type="text"
              name="speaker"
              required
              value={formData.speaker}
              onChange={handleChange}
              className="upload-input"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.9rem' }}
              placeholder="e.g. Pt. Shriram Sharma Acharya"
            />
          </div>

          {/* Duration */}
          <div className="upload-field" style={{ marginBottom: 16 }}>
            <label className="upload-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              <i className="fas fa-clock" style={{ marginRight: 6 }} /> Duration
            </label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="upload-input"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.9rem' }}
              placeholder="auto-filled"
            />
          </div>

          {/* Custom Searchable Category Dropdown */}
          <div ref={categoryDropdownRef} className="upload-field" style={{ marginBottom: 16, position: 'relative' }}>
            <label className="upload-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              <i className="fas fa-tags" style={{ marginRight: 6 }} /> Category <span className="upload-required">*</span>
            </label>
            
            <div style={{ position: 'relative' }}>
              {/* Trigger */}
              <div
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1.5px solid var(--border)',
                  fontSize: '0.9rem',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: selectedCategoryId ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {categories.find(c => c._id === selectedCategoryId)?.name || '-- Choose Category --'}
                </span>
                <i className={`fas ${isCategoryDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }} />
              </div>

              {/* Dropdown Menu */}
              {isCategoryDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: '#fff',
                    border: '1.5px solid var(--border)',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    maxHeight: 250,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <i className="fas fa-search" style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={e => setCategorySearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 12px 6px 28px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                        onClick={e => e.stopPropagation()} // prevent click from triggering anything else
                      />
                      {categorySearch && (
                        <i
                          className="fas fa-times"
                          onClick={() => setCategorySearch('')}
                          style={{ position: 'absolute', right: 10, color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                        />
                      )}
                    </div>
                  </div>
                  
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    <div
                      onClick={() => {
                        setSelectedCategoryId('');
                        setIsCategoryDropdownOpen(false);
                        setCategorySearch('');
                      }}
                      className={`searchable-dropdown-item ${selectedCategoryId === '' ? 'selected' : ''}`}
                    >
                      -- Choose Category --
                    </div>
                    {categories
                      .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                      .map(cat => (
                        <div
                          key={cat._id}
                          onClick={() => {
                            setSelectedCategoryId(cat._id);
                            setIsCategoryDropdownOpen(false);
                            setCategorySearch('');
                          }}
                          className={`searchable-dropdown-item ${selectedCategoryId === cat._id ? 'selected' : ''}`}
                        >
                          {cat.name}
                        </div>
                      ))}
                    {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        No categories found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Searchable Album Dropdown */}
          <div ref={albumDropdownRef} className="upload-field" style={{ marginBottom: 16, position: 'relative' }}>
            <label className="upload-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              <i className="fas fa-compact-disc" style={{ marginRight: 6 }} /> Albums <span className="upload-required">*</span>
            </label>

            <div style={{ position: 'relative' }}>
              {/* Trigger */}
              <div
                onClick={() => setIsAlbumDropdownOpen(!isAlbumDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1.5px solid var(--border)',
                  fontSize: '0.9rem',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: selectedAlbumIds.length > 0 ? 'var(--text-main)' : 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                  {selectedAlbumIds.length > 0 
                    ? `${selectedAlbumIds.length} album(s) selected` 
                    : '-- Choose Albums --'}
                </span>
                <i className={`fas ${isAlbumDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }} />
              </div>

              {/* Dropdown Menu */}
              {isAlbumDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: '#fff',
                    border: '1.5px solid var(--border)',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    maxHeight: 250,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <i className="fas fa-search" style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                      <input
                        type="text"
                        placeholder="Search albums..."
                        value={albumSearch}
                        onChange={e => setAlbumSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 12px 6px 28px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                        onClick={e => e.stopPropagation()} // prevent dropdown from closing
                      />
                      {albumSearch && (
                        <i
                          className="fas fa-times"
                          onClick={() => setAlbumSearch('')}
                          style={{ position: 'absolute', right: 10, color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                        />
                      )}
                    </div>
                  </div>

                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {filteredAlbums
                      .filter(a => (a.title || a.name).toLowerCase().includes(albumSearch.toLowerCase()))
                      .map(album => {
                        const isChecked = selectedAlbumIds.includes(album._id);
                        return (
                          <div
                            key={album._id}
                            onClick={() => handleAlbumCheckboxChange(album._id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                            className={`searchable-dropdown-item ${isChecked ? 'selected' : ''}`}
                          >
                            <span>{album.title || album.name}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              style={{ cursor: 'pointer', accentColor: 'var(--saffron)' }}
                            />
                          </div>
                        );
                      })}
                    {filteredAlbums.filter(a => (a.title || a.name).toLowerCase().includes(albumSearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {selectedCategoryId ? 'No albums found in this category' : 'No albums found. Select a category to filter or view all.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Show already selected albums */}
            {selectedAlbumIds.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selectedAlbumIds.map(id => {
                  const alb = albumsList.find(a => a._id === id);
                  return alb ? (
                    <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--saffron-pale)', color: 'var(--saffron-dark)', padding: '4px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                      {alb.title}
                      <i className="fas fa-times" style={{ cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => handleAlbumCheckboxChange(id)} />
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="upload-field" style={{ marginBottom: 16 }}>
            <label className="upload-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              <i className="fas fa-tags" style={{ marginRight: 6 }} /> Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="upload-input"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.9rem' }}
              placeholder="e.g. Pt Shriram Sharma, Sandhya Kirtan, Mantra"
            />
          </div>

          {/* Description */}
          <div className="upload-field" style={{ marginBottom: 16 }}>
            <label className="upload-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              <i className="fas fa-align-left" style={{ marginRight: 6 }} /> Description
            </label>
            <textarea
              name="description"
              rows="2"
              value={formData.description}
              onChange={handleChange}
              className="upload-input upload-textarea"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.9rem', resize: 'vertical' }}
              placeholder="Short description of the audio..."
            />
          </div>

          {/* Audio File Drag & Drop */}
          <div className="upload-field" style={{ marginBottom: 16 }}>
            <label className="upload-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              <i className="fas fa-file-audio" style={{ marginRight: 6 }} /> Audio File <span className="upload-required">*</span>
            </label>
            <div
              ref={dropRef}
              className={`upload-dropzone${isDragging ? ' upload-dropzone--dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              style={{ border: '2px dashed var(--saffron)', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', background: isDragging ? 'var(--saffron-pale)' : 'rgba(247,168,77,0.03)', transition: 'all 0.2s ease' }}
            >
              {audioFile ? (
                <div className="upload-dropzone-selected" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <i className="fas fa-check-circle" style={{ color: '#166534', fontSize: '1.5rem' }} />
                  <span className="upload-filename" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{audioFile.name}</span>
                  <span className="upload-fileext" style={{ background: 'var(--saffron-pale)', color: 'var(--saffron)', fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{getFileExt(audioFile.name)}</span>
                  <span className="upload-filesize" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                  <button
                    type="button"
                    className="upload-file-clear"
                    onClick={e => { e.stopPropagation(); setAudioFile(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: '1.1rem' }}
                    title="Remove file"
                  >
                    <i className="fas fa-times-circle" />
                  </button>
                </div>
              ) : (
                <div className="upload-dropzone-empty">
                  <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2.5rem', color: 'var(--saffron)', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{isDragging ? 'Drop the file here!' : 'Click to browse or drag & drop'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>MP3, WAV, OGG, M4A, FLAC, AAC, WMA up to 50MB</div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.wma"
              className="sr-only"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* Cover Image */}
          <div className="upload-field" style={{ marginBottom: 24 }}>
            <label className="upload-label" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              <i className="fas fa-image" style={{ marginRight: 6 }} /> Cover Image <span className="upload-optional">(optional)</span>
            </label>
            <div className="upload-image-picker" style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: 12, background: '#fff' }}>
              {imagePreview ? (
                <div className="upload-image-preview-wrap" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img src={imagePreview} alt="Cover preview" className="upload-image-preview" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
                  <div className="upload-image-preview-info">
                    <span className="upload-image-preview-name" style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>{imageFile?.name}</span>
                    <button
                      type="button"
                      className="upload-image-remove"
                      onClick={() => { if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview); setImageFile(null); setImagePreview(null); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                      style={{ background: 'none', border: '1px solid #e53e3e', color: '#e53e3e', padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      <i className="fas fa-times" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="upload-image-empty"
                  onClick={() => imageInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && imageInputRef.current?.click()}
                  style={{ textAlign: 'center', cursor: 'pointer', padding: 16 }}
                >
                  <i className="fas fa-camera" style={{ fontSize: '1.5rem', color: 'var(--text-light)', marginBottom: 6 }} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Choose cover image from gallery</div>
                </div>
              )}
              {/* Button to open gallery picker */}
              <button
                type="button"
                className="upload-btn-gallery"
                onClick={() => setShowAlbumGallery(true)}
                style={{ marginTop: 12, padding: '6px 12px', background: 'var(--saffron)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                Choose from Gallery
              </button>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
                className="sr-only"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    if (imagePreview) URL.revokeObjectURL(imagePreview);
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
          </div>

          {/* Progress bar */}
          {isSubmitting && (
            <div style={{ margin: '0 0 16px 0', background: 'rgba(247,168,77,0.05)', borderRadius: 10, padding: 14, border: '1px solid rgba(247,168,77,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <span>{uploadStatus || 'Preparing upload...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(247,168,77,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--brand-orange-accent)', transition: 'width 0.15s ease-out' }} />
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="upload-modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="upload-btn-cancel" style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="hero-cta" style={{ padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-upload" style={{ marginRight: 6 }} />
                  Upload Audio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Gallery modal */}
      {showAlbumGallery && (
        <div className="gallery-modal" onClick={() => setShowAlbumGallery(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, maxHeight: '80vh', overflowY: 'auto', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#333' }}>Select Cover Image</h3>
              <button type="button" onClick={() => setShowAlbumGallery(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#666' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
              {galleryImages.map((img, idx) => {
                const imgUrl = img.url ? resolveUrl(img.url) : resolveUrl(img);
                return (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt={`gallery-${idx}`}
                    style={{ width: '100%', height: 100, objectFit: 'contain', cursor: 'pointer', border: '2px solid transparent' }}
                    onClick={async () => {
                      // Revoke previous preview if it was a blob URL to avoid memory leaks
                      if (imagePreview && imagePreview.startsWith('blob:')) {
                        URL.revokeObjectURL(imagePreview);
                      }
                      // If the image is from the server (has a URL), fetch it to create a File object
                      if (img.url) {
                        try {
                          const fullUrl = resolveUrl(img.url);
                          const response = await fetch(fullUrl);
                          const blob = await response.blob();
                          const fileName = img.url.split('/').pop() || 'gallery-image.jpg';
                          const file = new File([blob], fileName, { type: blob.type });
                          setImageFile(file);
                        } catch (e) {
                          console.error('Failed to fetch gallery image', e);
                          setImageFile(null);
                        }
                      } else {
                        // If img is a base64/data URI, we can set it directly without a File
                        setImageFile(null);
                      }
                      setImagePreview(imgUrl);
                      setShowAlbumGallery(false);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
