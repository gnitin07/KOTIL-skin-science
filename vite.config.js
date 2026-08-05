import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5178 },
  build: {
    // Vercel compresses at the edge, so measure what users actually download.
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // One big index-[hash].js meant every deploy — even a copy tweak —
        // re-sent React and GSAP to every returning visitor. Neither changes
        // between deploys, so giving them their own hashed chunks lets the
        // immutable cache in vercel.json actually hold on to them: a repeat
        // visit after a content change then costs the app chunk alone.
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['gsap', 'gsap/ScrollTrigger', '@gsap/react', 'lenis'],
        },
      },
    },
  },
})
