import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'River Rat - Parker Dam Flow Tracker',
        short_name: 'River Rat',
        description: 'Real-time Colorado River flow levels for water sports near Parker, AZ',
        theme_color: '#0891B2',
        background_color: '#FDF8F0',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/flows/,
            handler: 'NetworkFirst',
            options: { cacheName: 'flow-data', expiration: { maxEntries: 60, maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com/,
            handler: 'NetworkFirst',
            options: { cacheName: 'weather-data', expiration: { maxEntries: 10, maxAgeSeconds: 3600 } },
          },
        ],
      },
    }),
  ],
})
