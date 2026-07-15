import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const isAdmin = role?.toLowerCase() === 'admin';
  const isOnlyUser = role?.toLowerCase() === 'onlyuser';
  const isUser = role?.toLowerCase() === 'user' || role?.toLowerCase() === 'onlyuser';
  const isManager = role === 'manager';
  const isPublicUser = role?.toLowerCase() === 'public_user';

  // Backward compatibility map for UI components using legacy strings
  const permissionMap = {
    'audio_upload': 'audios_create',
    'audio_edit': 'audios_update',
    'audio_delete': 'audios_delete',
    'audio_view': 'audios_read',
    'audios_view': 'audios_read',
    'category_create': 'categories_create',
    'category_edit': 'categories_update',
    'category_delete': 'categories_delete',
    'category_view': 'categories_read',
    'categories_view': 'categories_read',
    'album_create': 'albums_create',
    'album_edit': 'albums_update',
    'album_delete': 'albums_delete',
    'album_view': 'albums_read',
    'albums_view': 'albums_read',
    'feedback_view': 'feedback_read',
    'feedback_delete': 'feedback_delete'
  };

  // Check if user has a specific permission (admin always has all permissions)
  const hasPermission = (perm) => {
    if (isAdmin) return true;
    if (permissions.includes(perm)) return true;
    
    const standardPerm = permissionMap[perm];
    if (standardPerm && permissions.includes(standardPerm)) return true;
    
    const legacyPerm = Object.keys(permissionMap).find(key => permissionMap[key] === perm);
    if (legacyPerm && permissions.includes(legacyPerm)) return true;

    return false;
  };

  // Check if user has any of the provided permissions
  const hasAnyPermission = (perms) => {
    if (isAdmin) return true;
    return perms.some(perm => hasPermission(perm));
  };

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedPermissions = localStorage.getItem('permissions');
    if (storedToken) {
      setToken(storedToken);
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        setRole(payload.role);
        // Use permissions from token if available, otherwise from localStorage
        const tokenPerms = payload.permissions || [];
        const localPerms = storedPermissions ? JSON.parse(storedPermissions) : [];
        setPermissions(tokenPerms.length > 0 ? tokenPerms : localPerms);
      } catch (e) {
        console.error('Failed to parse token');
      }
    }
  }, []);

  // Fetch current user from API to get latest permissions on mount
  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          setRole(res.data.role);
          setPermissions(res.data.permissions || []);
          localStorage.setItem('permissions', JSON.stringify(res.data.permissions || []));
        })
        .catch(err => {
          console.warn('Failed to fetch current user:', err);
        });
    }
  }, [token]);

  // Attach token to api requests
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: newToken, role: userRole, permissions: userPerms, username: userUsername, email: userEmail, fullName: userFullName } = res.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', userRole);
    localStorage.setItem('permissions', JSON.stringify(userPerms || []));
    setToken(newToken);
    setRole(userRole);
    setPermissions(userPerms || []);
    setUser({ username: userUsername, email: userEmail, fullName: userFullName, role: userRole, permissions: userPerms, avatarUrl: res.data?.avatarUrl || '' });
    setShowLogin(false);
    return true;
  };

  const publicLogin = async (email, password) => {
    const res = await api.post('/login', { email, password });
    const { token: newToken, role: userRole, permissions: userPerms, username: userUsername, email: userEmail, fullName: userFullName } = res.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', userRole);
    localStorage.setItem('permissions', JSON.stringify(userPerms || []));
    setToken(newToken);
    setRole(userRole);
    setPermissions(userPerms || []);
    setUser({ username: userUsername, email: userEmail, fullName: userFullName, role: userRole, permissions: userPerms, avatarUrl: res.data?.avatarUrl || '' });
    return true;
  };

  const publicRegister = async (fullName, email, password) => {
    const res = await api.post('/register', { fullName, email, password });
    const { token: newToken, role: userRole, permissions: userPerms, username: userUsername, email: userEmail, fullName: userFullName } = res.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', userRole);
    localStorage.setItem('permissions', JSON.stringify(userPerms || []));
    setToken(newToken);
    setRole(userRole);
    setPermissions(userPerms || []);
    setUser({ username: userUsername, email: userEmail, fullName: userFullName, role: userRole, permissions: userPerms, avatarUrl: res.data?.avatarUrl || '' });
    return true;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/logout');
      }
    } catch (e) {
      console.warn('Backend logout failed', e);
    }
    setToken(null);
    setRole(null);
    setPermissions([]);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        permissions,
        user,
        setUser,
        isAdmin,
        isOnlyUser,
        isUser,
        isManager,
        isPublicUser,
        hasPermission,
        hasAnyPermission,
        login,
        publicLogin,
        publicRegister,
        logout,
        showLogin,
        setShowLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
