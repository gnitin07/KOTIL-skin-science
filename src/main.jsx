import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Tiny path router — the site has exactly two pages, so a full router would be
// overkill. /consult renders the same App in its conversion-first variant
// (vercel.json rewrites every path to index.html so deep links work).
const consult = window.location.pathname.replace(/\/+$/, '') === '/consult'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App consult={consult} />
  </React.StrictMode>,
)
