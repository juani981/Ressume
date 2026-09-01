import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { CVProvider } from './context/CVContext.jsx'

// Force clear local storage once to pick up the new fully-structured schema
localStorage.removeItem('cvData');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CVProvider>
      <App />
    </CVProvider>
  </React.StrictMode>,
)
