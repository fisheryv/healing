import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import * as Data from './data.js'
import './styles.css'

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
