import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

function Sidebar({ onOpenUpload }) {
  const { token, logout, isAdmin, isOnlyUser, isPublicUser, hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();

  // Determine if we should show any admin links (has any of the permissions)
  const showAdminLinks = isAdmin || 
    hasAnyPermission(['audio_view', 'audio_upload', 'audio_edit', 'audio_delete', 
                      'category_view', 'category_create', 'category_edit', 'category_delete',
                      'album_view', 'album_create', 'album_edit', 'album_delete',
                      'feedback_view', 'feedback_delete', 'analytics_view']);

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <Logo size={38} />
        <div>
          <div className="sidebar-brand-text">{isPublicUser ? 'AWGP Audio Hub' : 'Admin Panel'}</div>
          <div className="sidebar-brand-sub">AWGP Catalog</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav-links">
        <div className="nav-section-label">Main</div>

        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <i className="fas fa-th-large" />
          <span>Dashboard</span>
        </NavLink>

        {(isPublicUser || isAdmin || hasPermission('audio_view')) && (
          <NavLink to="/library" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fas fa-music" />
            <span>Audio Library</span>
          </NavLink>
        )}

        {isPublicUser && (
          <>
            <NavLink to="/favorites" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <i className="fas fa-heart" />
              <span>Favorites</span>
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <i className="fas fa-history" />
              <span>Listening History</span>
            </NavLink>
          </>
        )}

        {/* Profile — public users only */}
        {isPublicUser && (
          <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className="fas fa-user-circle" />
            <span>My Profile</span>
          </NavLink>
        )}

        {showAdminLinks && (
          <>
            <div className="nav-divider" />
            <div className="nav-section-label">Administration</div>

            {(isAdmin || hasPermission('analytics_view')) && (
              <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <i className="fas fa-cog" />
                <span>Admin Panel</span>
              </NavLink>
            )}

            {isAdmin && (
              <NavLink to="/users" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <i className="fas fa-users" />
                <span>Users Management</span>
              </NavLink>
            )}
          </>
        )}

        {/* Upload audio — admin/onlyuser with permission only */}
        {token && !isPublicUser && (isAdmin || hasPermission('audio_upload')) && (
          <button onClick={onOpenUpload} className="nav-item">
            <i className="fas fa-cloud-upload-alt" />
            <span>Upload Audio</span>
          </button>
        )}
      </nav>

      {/* Footer: logout */}
      <div style={{ marginTop: 'auto', padding: '16px 12px', borderTop: '1px solid var(--border-saffron)' }}>
        {token ? (
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="nav-item"
            style={{ width: '100%', color: '#e53e3e' }}
          >
            <i className="fas fa-sign-out-alt" />
            <span>Log Out</span>
          </button>
        ) : (
          <button onClick={() => navigate('/login')} className="nav-item" style={{ width: '100%' }}>
            <i className="fas fa-sign-in-alt" />
            <span>Admin Login</span>
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
