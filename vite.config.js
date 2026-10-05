import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/podpahfunkbol/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/game-api': {
        target: 'https://marsdesigner.com.br', changeOrigin: true,
        rewrite: path => path.replace(/^\/game-api/, '/podpahfunkbol/api'),
        configure(proxy) {
          proxy.on('proxyRes', response => {
            // Development runs on local HTTP; production keeps HTTPS-only cookies.
            if (response.headers['set-cookie']) response.headers['set-cookie'] = response.headers['set-cookie'].map(cookie => cookie.replace(/;\s*secure/gi, ''))
          })
        },
      },
    },
  },
}))
