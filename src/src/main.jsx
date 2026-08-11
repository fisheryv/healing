import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import * as Data from './data.js'
import './styles.css'

// 防闪屏（FOUC）：在 React 渲染前同步读取主题偏好并应用到 <html>
;(function preloadTheme() {
  try {
    let mode = localStorage.getItem('healing_app_theme_v1') || 'system'
    let resolved = mode
    if (mode === 'system' && window.matchMedia) {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    document.documentElement.dataset.theme = resolved
  } catch (e) { /* noop */ }
})()

// 暴露数据给 store 迁移逻辑使用（用于按 id 反查双语对象）
if (typeof window !== 'undefined') {
  window.__HEALING_DATA__ = Data
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
