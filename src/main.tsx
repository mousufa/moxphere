import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/fredoka/500.css'
import '@fontsource/fredoka/600.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
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
