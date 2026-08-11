import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // 允许 cloudflare tunnel 的随机域名访问（答辩 demo 用）
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      // 把所有 /api 和 /_ 的请求代理到 PocketBase，
      // 这样浏览器只请求 vite（5173），不会触发浏览器自身的代理设置。
      '/api': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
      '/_': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        ws: true, // Admin UI 的 realtime 用 websocket
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      // 与 server.proxy 一致：preview 模式下也需要把 /api /_ 转发到 PocketBase
      '/api': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
      '/_': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
