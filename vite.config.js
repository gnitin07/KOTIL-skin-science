import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Serve consult.html at /consult while developing.
 *
 * In production vercel.json and public/.htaccess both rewrite /consult to
 * /consult.html. Vite's own servers know nothing about either file, so without
 * this `npm run dev` quietly answers /consult with the homepage — which looks
 * exactly like the landing page being broken. Query strings are stripped before
 * matching because every ad click arrives carrying UTM parameters.
 */
const consultRoute = () => {
  const rewrite = (req, _res, next) => {
    const [path, query] = (req.url || '').split('?')
    if (path === '/consult' || path === '/consult/') {
      req.url = '/consult.html' + (query ? `?${query}` : '')
    }
    next()
  }
  // Block bodies, not `=> server.middlewares.use(...)`: that returns connect's
  // app, and Vite treats anything a configure*Server hook returns as a post
  // hook to invoke later — with no arguments, which crashes the server on
  // `req.url`. Return nothing.
  return {
    name: 'kotil-consult-route',
    configureServer(server) { server.middlewares.use(rewrite) },
    configurePreviewServer(server) { server.middlewares.use(rewrite) },
  }
}

export default defineConfig({
  plugins: [react(), consultRoute()],
  server: { port: 5178 },
  build: {
    // Vercel compresses at the edge, so measure what users actually download.
    reportCompressedSize: true,
    rollupOptions: {
      // Two pages, two HTML entries. /consult is a paid-ad landing page: giving
      // it its own entry is what keeps the main site's GSAP/Lenis chunk out of
      // its preload hints, and lets it carry a static noindex instead of one
      // injected by JavaScript. See public/.htaccess and vercel.json for the
      // /consult -> /consult.html rewrite that serves it at a clean URL.
      input: {
        main: resolve(__dirname, 'index.html'),
        consult: resolve(__dirname, 'consult.html'),
      },
      output: {
        // One big index-[hash].js meant every deploy — even a copy tweak —
        // re-sent React and GSAP to every returning visitor. Neither changes
        // between deploys, so giving them their own hashed chunks lets the
        // immutable cache in vercel.json actually hold on to them: a repeat
        // visit after a content change then costs the app chunk alone.
        //
        // FUNCTION form, not the shorter `{ motion: ['gsap', …] }` object form.
        // The object form declares each chunk up front, and Vite then lists it
        // as a modulepreload in EVERY HTML entry — so consult.html was
        // preloading 53 KB of GSAP and Lenis that page never executes, which
        // quietly undid the whole point of splitting the two pages. Deciding
        // per module instead lets Rollup work out which entry actually reaches
        // gsap (only the main site does) and hint accordingly.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
          if (/node_modules[\\/](gsap|@gsap|lenis)[\\/]/.test(id)) return 'motion'
        },
      },
    },
  },
})
