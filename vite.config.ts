import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-512.png'],
      manifest: {
        name: 'Sovereign Dominion',
        short_name: 'Dominion',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0A0E17',
        theme_color: '#0A0E17',
        icons: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,ply}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.workers\.dev\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supplier-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { host: true, port: 5173 },
  build: { target: 'esnext', sourcemap: false },
});
