import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          enabled: false,
        }
      },
    }),
    viteReact(),
  ],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('❌ [Vite Proxy Error]', err);
          });
          proxy.on('proxyReq', () => {
            // console.log('📤 [Vite Proxy Req]', req.method, req.url);
          });
          proxy.on('proxyRes', () => {
            // console.log('📥 [Vite Proxy Res]', proxyRes.statusCode, req.url);
          });
          // Log WebSocket upgrades
          proxy.on('open', () => {
            console.log('🔌 [Vite Proxy] WebSocket opened to backend');
          });
        }
      }
    }
  },
})

export default config
