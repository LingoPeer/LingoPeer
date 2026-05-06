import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Railway / reverse-proxy hostnames are not localhost; allow *.railway.app (leading dot = subdomains too).
  server: {
    allowedHosts: ['.railway.app','.com'],
  },
  preview: {
    allowedHosts: ['.railway.app','.com'],
  },
})
