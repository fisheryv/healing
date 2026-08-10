import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
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
})
