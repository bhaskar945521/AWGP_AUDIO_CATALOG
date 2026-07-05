import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const isAdmin = role?.toLowerCase() === 'admin';
  const isOnlyUser = role?.toLowerCase() === 'onlyuser';
  const isUser = role?.toLowerCase() === 'user' || role?.toLowerCase() === 'onlyuser';
  const isManager = role === 'manager';

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        setRole(payload.role);
      } catch (e) {
        console.error('Failed to parse token');
      }
    }
  }, []);

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
    const { token: newToken, role: userRole } = res.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', userRole);
    setToken(newToken);
    setRole(userRole);
    setShowLogin(false);
    return true;
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        isAdmin,
        isOnlyUser,
        isUser,
        isManager,
        login,
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
