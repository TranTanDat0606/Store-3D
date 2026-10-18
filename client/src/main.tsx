import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/contexts/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        {/* AC9 (#8): honor prefers-reduced-motion for ALL framer-motion usage app-wide
            (cart drawer slide, mobile sheet, chat launcher, future motion). The hero
            video self-gates via matchMedia directly — unaffected. */}
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
        <Toaster theme="dark" richColors position="top-right" closeButton duration={4000} />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
