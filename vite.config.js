import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // Agar PWA bisa dites di localhost
      },
      manifest: {
        name: 'Dashboard Cuaca Binsar',
        short_name: 'Cuaca',
        description: 'Aplikasi cek cuaca modern dan akurat',
        theme_color: '#00b4db',
        background_color: '#ffffff',
        display: 'standalone', // Membuat aplikasi full-screen tanpa address bar
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})