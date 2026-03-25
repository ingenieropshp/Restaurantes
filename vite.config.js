import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    /* 
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'PISIN',
        short_name: 'PISIN',
        description: 'Guía de restaurantes de Turbo, Antioquia',
        theme_color: '#0d0d0d',
        background_color: '#0d0d0d',
        display: 'standalone',
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
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }) 
    */
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      // Esto evita que el build se rompa si detecta módulos de Node.js
      // pero permite que empaquete correctamente react-router-dom
      external: [
        /^node:.*/,
        'fs',
        'path',
        'os',
        'crypto'
      ],
    },
  },
  resolve: {
    alias: {
      // Ayuda a la compatibilidad en entornos de Cloudflare
      '@': path.resolve(__dirname, './src'),
    },
  }
})