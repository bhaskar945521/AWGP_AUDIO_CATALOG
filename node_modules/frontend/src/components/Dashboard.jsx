import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api';
import { useNavigate, useOutletContext } from 'react-router-dom';
import CategoryCard from './CategoryCard';
import AlbumCard from './AlbumCard';
import AudioCard from './AudioCard';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';

const AUDIOS_PER_PAGE = 12;
const RECENT_COUNT = 8;

const categoryIcons = {
  spirituality: 'fas fa-om',
  wisdom:       'fas fa-book-open',
  discourses:   'fas fa-users',
  bhajans:      'fas fa-music',
  pravachans:   'fas fa-microphone-alt',
  meditation:   'fas fa-spa',
  others:       'fas fa-globe',
};

const categoryDescriptions = {
  spirituality: 'Spiritual teachings and discourses',
  wisdom: 'Wisdom and knowledge for life',
  discourses: 'Inspiring discourses and lectures',
  bhajans: 'Devotional songs and bhajans',
  pravachans: 'Spiritual pravachans and sermons',
  meditation: 'Guided meditation sessions',
  others: 'Other spiritual content'
};

// Bilingual synonym map for Hindi ↔ English search (same as backend for consistency)
const bilingualSynonyms = {
  // Hindi → English
  'भजन': ['bhajan', 'bhajans', 'devotional', 'devotional song', 'devotional songs'],
  'प्रवचन': ['pravachan', 'pravachans', 'discourse', 'discourses', 'lecture', 'lectures', 'sermon', 'sermons'],
  'स्पिरिचुअल': ['spiritual', 'spirituality', 'spiritualism'],
  'आध्यात्मिक': ['spiritual', 'spirituality', 'spiritualism'],
  'ध्यान': ['meditation', 'meditate', 'meditating'],
  'ज्ञान': ['wisdom', 'knowledge', 'gyan'],
  'गुरु': ['guru', 'teacher', 'master', 'spiritual teacher'],
  'संत': ['sant', 'saint', 'saints', 'saintly'],
  'भक्ति': ['bhakti', 'devotion', 'devotional'],
  'आरती': ['aarti', 'aarati', 'prayer', 'prayers'],
  'कीर्तन': ['kirtan', 'keertan', 'devotional singing'],
  'मंत्र': ['mantra', 'mantras', 'chant', 'chants'],
  'पूजा': ['pooja', 'puja', 'worship', 'worshiping'],
  'सत्संग': ['satsang', 'spiritual gathering', 'spiritual gatherings'],
  'सत्य': ['truth', 'satya'],
  'शांति': ['peace', 'shanti'],
  'प्रेम': ['love', 'prem'],
  // English → Hindi (for reverse search)
  'bhajan': ['भजन', 'भजनें'],
  'pravachan': ['प्रवचन', 'प्रवचनें'],
  'spiritual': ['स्पिरिचुअल', 'आध्यात्मिक'],
  'spirituality': ['स्पिरिचुअलता', 'आध्यात्मिकता'],
  'meditation': ['ध्यान'],
  'meditate': ['ध्यान करना'],
  'wisdom': ['ज्ञान'],
  'knowledge': ['ज्ञान'],
  'gyan': ['ज्ञान'],
  'guru': ['गुरु'],
  'teacher': ['गुरु', 'शिक्षक'],
  'master': ['गुरु', 'मास्टर'],
  'saint': ['संत'],
  'saints': ['संत'],
  'devotion': ['भक्ति'],
  'devotional': ['भक्ति', 'भक्तिपूर्ण'],
  'aarti': ['आरती'],
  'kirtan': ['कीर्तन'],
  'mantra': ['मंत्र'],
  'pooja': ['पूजा'],
  'puja': ['पूजा'],
  'worship': ['पूजा', 'पूजा करना'],
  'satsang': ['सत्संग'],
  'truth': ['सत्य'],
  'satya': ['सत्य'],
  'peace': ['शांति'],
  'shanti': ['शांति'],
  'love': ['प्रेम'],
  'prem': ['प्रेम']
};

// Function to get all search terms (original + synonyms + transliterations)
const getAllSearchTerms = (query) => {
  const terms = [query.toLowerCase()];
  const words = query.toLowerCase().split(/\s+/);
  
  words.forEach(word => {
    if (bilingualSynonyms[word]) {
      terms.push(...bilingualSynonyms[word].map(s => s.toLowerCase()));
    }
  });
  
  return [...new Set(terms)]; // Remove duplicates
};

// Check if any search term matches any part of the target
const matchesSearch = (target, searchTerms) => {
  if (!target) return false;
  const targetLower = String(target).toLowerCase();
  return searchTerms.some(term => targetLower.includes(term));
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useOutletContext();
  const { setCurrentAudio, setQueue } = useAudio();
  const { isAdmin } = useAuth();

  const [audios, setAudios]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [albums, setAlbums]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [audiosRes, catsRes, albumsRes] = await Promise.all([
        api.get('/audios'),
        api.get('/categories'),
        api.get('/albums'),
      ]);
      setAudios(audiosRes.data);
      setAlbums(albumsRes.data);

      // Merge: categories from DB + any categories found in audios (for old data)
      const dbCats = catsRes.data;
      const dbCatNames = new Set(dbCats.map(c => c.name));
      const audioCats = audiosRes.data
        .map(a => a.category)
        .filter(c => c && !dbCatNames.has(c));
      const extraCats = [...new Set(audioCats)].map(name => ({ name, _id: `auto-${name}` }));
      setCategories([...dbCats, ...extraCats]);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const handleCategoriesUpdated = () => {
      fetchDashboardData();
    };
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('categoriesUpdated', handleCategoriesUpdated);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdated);
      window.removeEventListener('resize', handleResize);
    };
  }, [fetchDashboardData]);

  const toggleFavorite = async (id) => {
    try {
      const res = await api.patch(`/audios/${id}/favorite`);
      setAudios(prev => prev.map(a => a._id === id ? { ...a, isFavorite: res.data.isFavorite } : a));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleDelete = (id) => setAudios(prev => prev.filter(a => a._id !== id));

  // Category click → navigate to Albums page with category filter
  const handleCategoryClick = (cat) => {
    const categoryValue = cat._id && !String(cat._id).startsWith('auto-') ? cat._id : cat.name;
    if (!categoryValue) return;
    navigate(`/albums?category=${encodeURIComponent(categoryValue)}`);
  };

  // Search filtering
  const q = searchQuery?.trim() || '';
  const isSearching = !!searchQuery;
  const searchTerms = isSearching ? getAllSearchTerms(q) : [];

  const filtered = useMemo(() => audios.filter(a =>
    !isSearching ||
    matchesSearch(a.title, searchTerms) ||
    matchesSearch(a.speaker, searchTerms) ||
    matchesSearch(a.category, searchTerms) ||
    (a.tags && a.tags.some(t => matchesSearch(t, searchTerms)))
  ), [audios, isSearching, searchTerms]);

  // Recently added (latest N)
  const recentlyAdded = useMemo(() =>
    [...audios].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, RECENT_COUNT),
    [audios]
  );

  // Get audio count for each album
  const getAlbumAudioCount = (albumId) => {
    return audios.filter(a => a.albumIds && a.albumIds.some(id => (typeof id === 'string' ? id : id._id) === albumId)).length;
  };

  // Get album count for each category
  const getCategoryAlbumCount = (catId) => {
    return albums.filter(al => {
      const cid = typeof al.categoryId === 'string' ? al.categoryId : al.categoryId?._id;
      return cid === catId;
    }).length;
  };

  // Featured Albums (first 4)
  const featuredAlbums = useMemo(() => albums.slice(0, 4), [albums]);

  // Pagination for All Audios
  const totalPages = Math.ceil(filtered.length / AUDIOS_PER_PAGE);
  const paginatedAudios = filtered.slice((currentPage - 1) * AUDIOS_PER_PAGE, currentPage * AUDIOS_PER_PAGE);

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  return (
    <div>
      {/* ── SEARCH RESULTS MODE ── */}
      {isSearching && (
        <section>
          <div className="search-results-header">
            <div className="search-results-left">
              <span className="search-results-badge">
                <i className="fas fa-search" />
                {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
              </span>
              <h2 className="search-results-title">
                Results for "<span>{searchQuery}</span>"
              </h2>
            </div>
            <button className="search-results-clear" onClick={() => setSearchQuery('')}>
              <i className="fas fa-times" />
              Clear Search
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="search-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="search-empty-state">
              <div className="search-empty-icon"><i className="fas fa-search" /></div>
              <h3>No matches found</h3>
              <p>Try different keywords, or browse categories below.</p>
              <button className="hero-cta" onClick={() => setSearchQuery('')}>
                <i className="fas fa-times" /> Clear Search
              </button>
            </div>
          ) : (
            <>
              <div className="audios-grid">
                {paginatedAudios.map(audio => (
                  <AudioCard key={audio._id} {...audio}
                    onPlay={() => { setQueue(filtered); setCurrentAudio(audio); }}
                    onToggleFavorite={() => toggleFavorite(audio._id)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <PaginationControls page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
              )}
            </>
          )}

          {!loading && filtered.length > 0 && categories.length > 0 && (
            <section className="section-block section-block--spacious">
              <div className="section-header">
                <div className="section-title">Browse by Category</div>
              </div>
              <div className="categories-grid">
                {categories.map(cat => (
                  <CategoryCard key={cat._id} title={cat.name}
                    count={albums.filter(al => {
                      const cid = typeof al.categoryId === 'string' ? al.categoryId : al.categoryId?._id;
                      return cid === cat._id;
                    }).length}
                    icon={categoryIcons[cat.name?.toLowerCase()] || 'fas fa-folder'}
                    imageUrl={cat.coverImageUrl}
                    onClick={() => handleCategoryClick(cat)}
                  />
                ))}
              </div>
            </section>
          )}
        </section>
      )}

      {/* ── NORMAL MODE (no search) ── */}
      {!isSearching && (
        <>
          {/* ── HERO ── */}
          <div className="hero-section">
            <div className="hero-content">
              <span className="hero-eyebrow">
                <i className="fas fa-headphones" /> AWGP Digital Archive
              </span>
              <h1 className="hero-title">
                <span className="hero-title-line">Spiritual Knowledge,</span>
                <span className="hero-title-line hero-title-line--accent">Preserved Forever</span>
              </h1>
              <div className="hero-actions">
                <p className="hero-subtitle hero-subtitle--spaced">
                <span className="hero-subtitle-line">Explore the timeless teachings of <strong className="hero-highlight">Pragya Geet</strong>,</span>
                <span className="hero-subtitle-line"><strong className="hero-highlight">Amritvani</strong>, and profound spiritual wisdom from  </span>
                <span className="hero-subtitle-line hero-subtitle-line--no-break"><strong className="hero-highlight">All World Gayatri Pariwar</strong> — all in one place.</span>
              </p>
              </div>

              {!loading && (
                <div className="hero-stats">
                  <div className="hero-stat">
                    <div className="hero-stat-number">{audios.length}</div>
                    <div className="hero-stat-label">Total Tracks</div>
                  </div>
                  <div className="hero-stat">
                    <div className="hero-stat-number">{categories.length}</div>
                    <div className="hero-stat-label">Categories</div>
                  </div>
                  <div className="hero-stat">
                    <div className="hero-stat-number">{albums.length}</div>
                    <div className="hero-stat-label">Albums</div>
                  </div>
                  <div className="hero-stat">
                    <div className="hero-stat-number">{audios.filter(a => a.isFavorite).length}</div>
                    <div className="hero-stat-label">Favorites</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 1. FEATURED ALBUMS ── */}
          
          {/* ── 2. ALL ALBUMS GRID ── */}
          {!loading && albums.length > 0 && (
            <section className="section-block section-block--spacious">
              <div className="section-header">
                <div className="section-title">All Albums</div>
              </div>
              <div className="albums-grid">
                {isAdmin && (
                  <button
                    onClick={() => navigate('/albums')}
                    className="add-album-card"
                  >
                    <i className="fas fa-plus-circle add-album-card__icon" />
                    <span className="add-album-card__label">Create Album</span>
                  </button>
                )}
                {albums.map((album, index) => (
                  <AlbumCard
                    key={album._id}
                    name={album.name}
                    title={album.title}
                    description={album.description}
                    coverImage={album.coverImage}
                    count={getAlbumAudioCount(album._id)}
                    onClick={() => navigate(`/albums/${album._id}`)}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── 2. CATEGORIES MARQUEE ── */}
          {categories.length > 0 && (
            <section className="section-block section-block--spacious">
              <div className="section-header">
                <div className="section-title">Browse Categories</div>
                <span className="section-count">{categories.length} categories</span>
              </div>
              <div className="categories-marquee">
                <div className="categories-marquee-content">
                  {([...categories, ...categories] || []).map((cat, index) => (
                    <CategoryCard key={`${cat._id}-${index}`} title={cat.name}
                      count={getCategoryAlbumCount(cat._id)}
                      icon={categoryIcons[cat.name?.toLowerCase()] || 'fas fa-folder'}
                      imageUrl={cat.coverImageUrl}
                      description={categoryDescriptions[cat.name?.toLowerCase()] || 'Explore spiritual content'}
                      onClick={() => handleCategoryClick(cat)}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Audio Library section removed for UI simplification */}

          {/* ── 4. RECENTLY UPLOADS ── */}
          
        </>
      )}

      <Footer />
    </div>
  );
}

/* ── Pagination Component ── */
function PaginationControls({ page, totalPages, onChange }) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  const visible = pages.filter(p =>
    p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  const rendered = [];
  let lastShown = 0;
  for (const p of visible) {
    if (p - lastShown > 1) rendered.push('...');
    rendered.push(p);
    lastShown = p;
  }

  return (
    <div className="pagination">
      <button className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <i className="fas fa-chevron-left" />
      </button>
      {rendered.map((item, i) =>
        item === '...' ? (
          <span key={`dots-${i}`} className="page-dots">…</span>
        ) : (
          <button key={item} className={`page-btn${item === page ? ' active' : ''}`} onClick={() => onChange(item)}>
            {item}
          </button>
        )
      )}
      <button className="page-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <i className="fas fa-chevron-right" />
      </button>
    </div>
  );
}
