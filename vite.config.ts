import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `npm run dev` forwards EV requests to the local Python backend (uvicorn on :8000).
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
