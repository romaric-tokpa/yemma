import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // Charger .env depuis la racine du projet (pour VITE_* depuis env.example)
  envDir: path.resolve(__dirname, '..'),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**'],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 3000,
      protocol: 'ws',
      overlay: true, // Afficher l'overlay pour les erreurs réelles, mais ignorer les warnings HMR
    },
    // Proxy /api vers les services ou nginx en dev
    // Routes directes pour éviter 502/404 via nginx
    proxy: {
      '/api/v1/auth': {
        target: process.env.VITE_AUTH_PROXY_TARGET || 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/v1/users': {
        target: process.env.VITE_AUTH_PROXY_TARGET || 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/v1/admin-invitations': {
        target: process.env.VITE_AUTH_PROXY_TARGET || 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/v1/profiles': {
        // En dev : cible directe candidate (8002) pour éviter 502 via nginx
        target: process.env.VITE_CANDIDATE_PROXY_TARGET || process.env.VITE_PROXY_TARGET || 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/v1/jobs': {
        target: process.env.VITE_CANDIDATE_PROXY_TARGET || process.env.VITE_PROXY_TARGET || 'http://localhost:8002',
        changeOrigin: true,
      },
      // /api/v1/company/jobs est sur le service Candidate (offres entreprise)
      '/api/v1/company': {
        target: process.env.VITE_CANDIDATE_PROXY_TARGET || process.env.VITE_PROXY_TARGET || 'http://localhost:8002',
        changeOrigin: true,
      },
      // /api/v1/admin/jobs est sur le service Candidate (pas Admin) - règle AVANT /api/v1/admin
      '/api/v1/admin/jobs': {
        target: process.env.VITE_CANDIDATE_PROXY_TARGET || process.env.VITE_PROXY_TARGET || 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/v1/parse': {
        target: process.env.VITE_PARSING_PROXY_TARGET || process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/v1/documents': {
        target: process.env.VITE_DOCUMENT_PROXY_TARGET || 'http://localhost:8003',
        changeOrigin: true,
      },
      '/api/v1/admin': {
        target: process.env.VITE_ADMIN_PROXY_TARGET || 'http://localhost:8009',
        changeOrigin: true,
      },
      '/api/v1/search': {
        target: process.env.VITE_SEARCH_PROXY_TARGET || 'http://localhost:8004',
        changeOrigin: true,
      },
      '/api/v1/candidates': {
        target: process.env.VITE_SEARCH_PROXY_TARGET || 'http://localhost:8004',
        changeOrigin: true,
      },
      '/api/v1/plans': {
        target: process.env.VITE_PAYMENT_PROXY_TARGET || 'http://localhost:8006',
        changeOrigin: true,
      },
      '/api/v1/subscriptions': {
        target: process.env.VITE_PAYMENT_PROXY_TARGET || 'http://localhost:8006',
        changeOrigin: true,
      },
      '/api/v1/payments': {
        target: process.env.VITE_PAYMENT_PROXY_TARGET || 'http://localhost:8006',
        changeOrigin: true,
      },
      '/api/v1/invoices': {
        target: process.env.VITE_PAYMENT_PROXY_TARGET || 'http://localhost:8006',
        changeOrigin: true,
      },
      '/api/v1/quotas': {
        target: process.env.VITE_PAYMENT_PROXY_TARGET || 'http://localhost:8006',
        changeOrigin: true,
      },
      '/api/v1/notifications': {
        target: process.env.VITE_NOTIFICATION_PROXY_TARGET || 'http://localhost:8007',
        changeOrigin: true,
      },
      '/api/v1/companies': {
        target: process.env.VITE_COMPANY_PROXY_TARGET || process.env.VITE_PROXY_TARGET || 'http://localhost:8005',
        changeOrigin: true,
      },
      '/api/v1/invitations': {
        target: process.env.VITE_COMPANY_PROXY_TARGET || process.env.VITE_PROXY_TARGET || 'http://localhost:8005',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
