import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/gloock/400.css'
import '@fontsource/hanken-grotesk/400.css'
import '@fontsource/hanken-grotesk/500.css'
import '@fontsource/hanken-grotesk/600.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import './styles.css'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { loadStore } from './lib/store'
import { initSync } from './lib/sync'

registerSW({ immediate: true })

loadStore().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  void initSync()
})
