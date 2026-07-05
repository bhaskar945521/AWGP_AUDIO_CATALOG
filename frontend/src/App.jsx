import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';

// Lazy loaded components for faster initial load
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Library = React.lazy(() => import('./components/Library'));
const Albums = React.lazy(() => import('./components/Albums'));
const AlbumDetails = React.lazy(() => import('./components/AlbumDetails'));
const Favorites = React.lazy(() => import('./components/Favorites'));
const Details = React.lazy(() => import('./components/Details'));
const Admin = React.lazy(() => import('./components/Admin'));
const Login = React.lazy(() => import('./components/Login'));
const UsersManagement = React.lazy(() => import('./components/UsersManagement'));

// Loading component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '60vh',
    fontSize: '1.2rem',
    color: 'var(--text-muted)'
  }}>
    <div className="search-spinner" style={{ marginRight: '12px' }} />
    Loading...
  </div>
);

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: '#1f2937',
            color: '#fff',
            fontSize: '0.88rem',
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          },
          success: {
            iconTheme: { primary: '#f7a84d', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#e53e3e', secondary: '#fff' },
          },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* All application pages share the persistent Layout shell */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="library" element={<Library />} />
            <Route path="albums" element={<Albums />} />
            <Route path="albums/:id" element={<AlbumDetails />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="details/:id" element={<Details />} />
            <Route path="admin" element={<Admin />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="login" element={<Login />} />
            {/* 404 Catch-All Route */}
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
