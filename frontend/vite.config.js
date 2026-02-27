import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
    },
    build: {
        target: 'es2020',
    },
    // Copy service worker and manifest to dist
    publicDir: 'public',
})
