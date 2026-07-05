import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
