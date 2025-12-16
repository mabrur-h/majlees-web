import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupMockTelegramEnv } from './mockEnv'
import './index.css'
import App from './App.tsx'

// Setup mock environment BEFORE any SDK calls (dev only)
setupMockTelegramEnv();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
