import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initialize WASM module
import('./wasm/init').then(() => {
  console.log('🚀 WASM astronomical core initialized')
}).catch(console.error)

// Enable React 18 concurrent features
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)