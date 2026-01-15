import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { store } from './store/store.ts'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0a0a0a',
                color: '#00ffff',
                border: '1px solid #00ffff',
                borderRadius: '8px',
                fontFamily: 'Orbitron, monospace',
              },
              success: {
                iconTheme: {
                  primary: '#00ff41',
                  secondary: '#0a0a0a',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff0080',
                  secondary: '#0a0a0a',
                },
              },
            }}
          />
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>,
)