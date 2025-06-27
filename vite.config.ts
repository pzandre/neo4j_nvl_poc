import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env
  },
  server: {
    port: 5173,
    allowedHosts: ['localhost', 'cf30-2804-13b4-85ac-a501-19a9-22b7-9a62-7a8e.ngrok-free.app']
  }
})
