import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ✅ 2025 Performance: Optimized React 19.1.1 error handling
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found - check index.html');
}

// ✅ React 19.1.1: Enhanced concurrent features
const root = ReactDOM.createRoot(rootElement, {
  // ✅ 2025 Optimization: Enable all React 19 performance features
  identifierPrefix: 'starscalendars-',
  onRecoverableError: (error, errorInfo) => {
    console.error('⚠️ React Recoverable Error:', error, errorInfo);
  }
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);