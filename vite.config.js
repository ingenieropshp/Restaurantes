import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: './', 
  plugins: [
    react(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      // Esto le dice a Cloudflare que ignore estos módulos al empaquetar
      external: [
        /^node:.*/,
        'path',
        'fs',
        'crypto',
        'os',
        'url',
        'util',
        'events',
        'process'
      ],
    },
  },
  resolve: {
    alias: {
      // Proporciona un alias vacío para módulos de Node que Firebase pueda buscar
      'path': 'path-browserify',
    }
  }
})