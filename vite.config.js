import { defineConfig } from 'vite'

export default defineConfig({
  // Vite config
  server: {
    port: 5173,
  },
  
  // Environment variables are automatically loaded from .env and .env.local
  // Access them in your code with: import.meta.env.VITE_*
  
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
