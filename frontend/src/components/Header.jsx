import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import VoiceSearch from './VoiceSearch';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Header({ onToggleSidebar, onVoiceResult, searchQuery, onSearchChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout, isAdmin, isOnlyUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [siteTitle, setSiteTitle] = useState('AWGP Audio Hub');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const notifRef = useRef(null);
  const categoriesRef = useRef(null);
  const searchInputRef = useRef(null);
  const [clickCount, setClickCount] = useState(0);
  const lastClickTime = useRef(0);

  // Handle voice search result: update query, focus input, show toast, and propagate if needed
  const handleVoiceResult = (text) => {
    if (onSearchChange) onSearchChange(text);
    if (searchInputRef.current) searchInputRef.current.focus();
    toast.success(`Voice search: ${text}`);
    if (onVoiceResult) onVoiceResult(text);
  };

  const handleCategoriesToggle = () => {
    setCategoriesOpen(prev => !prev);
  };

  const handleCategorySelect = (cat) => {
    setCategoriesOpen(false);
    navigate(`/albums?category=${cat._id}`);
  };

  const closeCategories = () => {
    setCategoriesOpen(false);
  };

  // Track which notification IDs the user has already seen
  const getSeenIds = () => {
    try {
      return JSON.parse(localStorage.getItem('seenNotifIds') || '[]');
    } catch { return []; }
  };

  const markAllSeen = (items) => {
    const ids = items.map(i => i._id);
    const existing = getSeenIds();
    const combined = Array.from(new Set([...existing, ...ids])).slice(-50);
    localStorage.setItem('seenNotifIds', JSON.stringify(combined));
  };

  // Load site title from settings and categories for dropdown
  useEffect(() => {
    api.get('/settings')
      .then(res => { if (res.data?.siteTitle) setSiteTitle(res.data.siteTitle); })
      .catch(() => {});
    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  // Fetch recent uploads for notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/audios/recent/count?hours=24');
        const items = res.data.items || [];
        const top5Items = items.slice(0, 5);
        setNotifItems(top5Items);
        const seenIds = getSeenIds();
        const unseen = top5Items.filter(i => !seenIds.includes(i._id));
        setNotifCount(unseen.length);
      } catch { }
    };
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+Shift+A to go to login
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigate('/login');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleLogoClick = () => {
    const now = Date.now();
    // If clicks are within 500ms of each other, count them!
    if (now - lastClickTime.current < 500) {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount === 5) {
        // 5 clicks! Go to login page!
        navigate('/login');
        setClickCount(0);
      }
    } else {
      // Reset if more than 500ms since last click
      setClickCount(1);
    }
    lastClickTime.current = now;
  };

  const handleSearchSubmit = () => {
    const trimmedQuery = (searchQuery || '').trim();

    if (!trimmedQuery) {
      searchInputRef.current?.focus();
      return;
    }

    if (location.pathname !== '/library') {
      navigate('/library');
    }
  };

  return (
    <header className="topbar">
      {/* LEFT: Logo + title + admin sidebar toggle */}
      <div className="topbar-left">
        {isAdmin && (
          <button
            onClick={onToggleSidebar}
            className="topbar-toggle-btn"
            title="Toggle Sidebar"
          >
            <i className="fas fa-bars" />
          </button>
        )}
        <div style={{ cursor: 'pointer' }} onClick={handleLogoClick}>
          <Logo size={42} />
        </div>
        <div>
          <div className="topbar-title">{siteTitle}</div>
          <span className="topbar-subtitle">Shantikunj, Haridwar</span>
        </div>
      </div>

      {/* CENTER: Search bar */}
      <div className="topbar-center">
        <div className="search-bar">
          <button
            type="button"
            className="search-submit-btn"
            onClick={handleSearchSubmit}
            aria-label="Search"
          >
            <i className="fas fa-search" />
          </button>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery || ''}
            onChange={e => onSearchChange && onSearchChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchSubmit();
              }
            }}
            ref={searchInputRef}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange && onSearchChange('')}
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>

      {/* RIGHT: nav links + voice + notif + auth */}
      <div className="topbar-right">
        <nav className="nav-links-top">
          <NavLink to="/" className={({ isActive }) => `nav-link-top${isActive ? ' active' : ''}`}>Home</NavLink>
          <NavLink to="/albums" className={({ isActive }) => `nav-link-top${isActive ? ' active' : ''}`}>Albums</NavLink>
          {/* Categories dropdown */}
          <div
            className="nav-dropdown"
            ref={categoriesRef}
          >
            <button
              type="button"
              className="nav-link-top nav-dropdown-trigger"
              onClick={handleCategoriesToggle}
              aria-expanded={categoriesOpen}
              aria-haspopup="menu"
            >
              Categories ▾
            </button>
            <div className="dropdown-content" style={{ display: categoriesOpen ? 'block' : undefined }}>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  type="button"
                  className="dropdown-link"
                  onClick={() => handleCategorySelect(cat)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <NavLink to="/favorites" className={({ isActive }) => `nav-link-top${isActive ? ' active' : ''}`}>Favorites</NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-link-top${isActive ? ' active' : ''}`}>History</NavLink>
          {(isAdmin || isOnlyUser) && <NavLink to="/admin" className={({ isActive }) => `nav-link-top${isActive ? ' active' : ''}`}>Admin</NavLink>}
        </nav>
        <VoiceSearch onResult={handleVoiceResult} />
        {/* NOTIFICATION BELL + DROPDOWN */}
        <div className="notif-wrapper" ref={notifRef}>
          <button className="notif-btn" title="Recent uploads" onClick={() => {
            setNotifOpen(p => !p);
            if (!notifOpen) {
              // Opening dropdown → mark all as seen, dismiss badge
              markAllSeen(notifItems);
              setNotifCount(0);
            }
          }}>
            <i className="fas fa-bell" />
            {notifCount > 0 && <span className="notif-badge">{notifCount > 9 ? '9+' : notifCount}</span>}
          </button>
          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">
                <span className="notif-dropdown-title"><i className="fas fa-bell" /> Recent Uploads</span>
                {notifCount > 0 && (<span className="notif-dropdown-count">{notifCount} new</span>)}
              </div>
              <div className="notif-dropdown-body">
                {notifItems.length === 0 ? (
                  <div className="notif-empty"><i className="fas fa-bell-slash" /><p>No recent uploads</p></div>
                ) : (
                  notifItems.map(item => (
                    <button key={item._id} className="notif-item" onClick={() => { setNotifOpen(false); navigate(`/details/${item._id}`); }}>
                      <div className="notif-item-icon"><i className="fas fa-music" /></div>
                      <div className="notif-item-content">
                        <div className="notif-item-title">{item.title}</div>
                        <div className="notif-item-meta">{item.speaker}{item.category ? ` · ${item.category}` : ''}</div>
                      </div>
                      <div className="notif-item-time">{timeAgo(item.createdAt)}</div>
                    </button>
                  ))
                )}
              </div>
              {notifItems.length > 0 && (
                <div className="notif-dropdown-footer">
                  <button onClick={() => { setNotifOpen(false); navigate('/library'); }}>View All <i className="fas fa-arrow-right" /></button>
                </div>
              )}
            </div>
          )}
        </div>
        {token ? (
          <button className="btn-logout" onClick={() => { logout(); navigate('/'); }}>
            <i className="fas fa-sign-out-alt auth-btn-icon" />
            Logout
          </button>
        ) : null}
      </div>
    </header>
  );
}
