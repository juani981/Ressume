import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { CVProvider } from './context/CVContext.jsx'
import { setupDisableNativeTooltips } from './utils/disableNativeTooltips.js'

// Disable native browser tooltips globally across the application
setupDisableNativeTooltips();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CVProvider>
      <App />
    </CVProvider>
  </React.StrictMode>,
)
