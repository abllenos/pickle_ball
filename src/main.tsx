import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { queryClient } from './app/queryClient'
import { router } from './app/router'
import { initCast, startCastReceiver } from './lib/cast'
import { startThemeSync } from './lib/theme'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/ui.css'

registerSW({ immediate: true })
startThemeSync()
initCast()
startCastReceiver()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>,
)


