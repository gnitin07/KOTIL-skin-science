import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Entry for index.html — the main site, and nothing else. /consult is a second
// Rollup entry (consult.html + src/consult-main.jsx), so neither page carries
// the other's JavaScript, CSS or preload hints.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
