import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Font Awesome — loaded from local node_modules (works offline, no CDN needed)
import '@fortawesome/fontawesome-free/css/all.min.css'
// Inter font — loaded from local node_modules (works offline, no CDN needed)
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { AudioProvider } from './context/AudioContext'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AudioProvider>
        <App />
      </AudioProvider>
    </AuthProvider>
  </StrictMode>,
)
