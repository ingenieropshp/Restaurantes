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
      // Solo externalizamos módulos internos de Node que Cloudflare no soporta
      external: [
        /^node:.*/,
        'path',
        'fs',
        'os',
        'crypto',
        'url',
        'util',
        'events',
        'process'
      ],
    },
  }
})