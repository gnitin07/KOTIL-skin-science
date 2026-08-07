import React from 'react'
import ReactDOM from 'react-dom/client'
import Consult from './Consult.jsx'

// Entry for consult.html. Kept separate from main.jsx — and NOT a runtime
// branch inside it — because Vite writes <link rel="modulepreload"> hints per
// HTML file. Sharing one entry meant every /consult visitor eagerly fetched the
// homepage's GSAP + Lenis chunk (53 KB gzipped) that this page never runs.
// Two entries, two dependency graphs, two honest sets of preload hints.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Consult />
  </React.StrictMode>,
)
