// ABOUTME: Vite entry point. Renders the root React component.
// ABOUTME: Imports global styles and mounts App into the DOM.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
