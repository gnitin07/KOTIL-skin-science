import { useState, useEffect, useRef, useCallback } from 'react'
import { BANNERS } from '../data.js'
import { useRevealed } from '../useRevealed.js'
import AVIF_URLS from '../avif-manifest.json'

const HAS_AVIF = new Set(AVIF_URLS)
const avif = (url) => (HAS_AVIF.has(url) ? url.replace(/\.webp$/, '.avif') : null)

const SLIDE_MS = 4000

/**
 * Full-width auto-playing hero banner carousel.
 * - Serves a landscape image on desktop, a portrait one on mobile (<picture>).
 * - Auto-advances every 4s; pauses on hover/touch and when off-screen.
 * - Swipeable on touch, arrow + dot controls, respects reduced-motion.
 * Self-contained (own state/timer) — independent of the site GSAP hook.
 */
export default function HeroBanner() {
  const [index, setIndex] = useState(0)
  const count = BANNERS.length
  const revealed = useRevealed(index, count)
  const timer = useRef(null)
  const paused = useRef(false)
  const inView = useRef(true)
  const rootRef = useRef(null)
  const touchX = useRef(null)

  const go = useCallback((n) => setIndex(((n % count) + count) % count), [count])
  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  const stop = useCallback(() => { clearInterval(timer.current); timer.current = null }, [])
  const start = useCallback(() => {
    stop()
    if (paused.current || !inView.current || count < 2) return
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS)
  }, [stop, count])

  // (re)start whenever the slide changes so the interval always waits a full cycle
  useEffect(() => { start(); return stop }, [index, start, stop])

  // pause when the banner scrolls out of view
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { inView.current = e.isIntersecting; start() }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [start])

  // keyboard arrows when the carousel has focus
  const onKey = (e) => {
    if (e.key === 'ArrowRight') next()
    else if (e.key === 'ArrowLeft') prev()
  }

  const hold = () => { paused.current = true; stop() }
  const release = () => { paused.current = false; start() }
  const onTouchStart = (e) => { hold(); touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - (touchX.current ?? 0)
    if (Math.abs(dx) > 45) (dx < 0 ? next : prev)()
    release()
  }

  return (
    <section
      className="hbanner" id="home" ref={rootRef}
      aria-roledescription="carousel" aria-label="Featured offers"
      onMouseEnter={hold} onMouseLeave={release}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      onKeyDown={onKey} tabIndex={0}
    >
      <div className="hbanner__track">
        {BANNERS.map((b, i) => (
          <a
            className={`hbanner__slide${i === index ? ' is-active' : ''}`}
            key={b.id} href={b.href}
            /* WhatsApp slides leave the site, so they open in a new tab; the
               monsoon slide is an in-page anchor and must stay in this one. */
            {...(b.href.startsWith('#')
              ? {}
              : { target: '_blank', rel: 'noopener noreferrer' })}
            aria-label={b.cta}
            aria-hidden={i !== index} tabIndex={i === index ? 0 : -1}
          >
            {/* Only the visible slide is mounted (see useRevealed) — all four
                used to download during first paint, ~430KB, to show one.
                No width/height: the portrait mobile crop and the landscape
                desktop crop have different ratios, so the CSS owns sizing.
                AVIF <source> must precede its WebP twin — first match wins. */}
            {revealed.has(i) && (
              <picture>
                {avif(b.mobile) && <source media="(max-width: 768px)" srcSet={avif(b.mobile)} type="image/avif" />}
                <source media="(max-width: 768px)" srcSet={b.mobile} type="image/webp" />
                {avif(b.desktop) && <source media="(min-width: 769px)" srcSet={avif(b.desktop)} type="image/avif" />}
                <source media="(min-width: 769px)" srcSet={b.desktop} type="image/webp" />
                <img
                  src={b.desktop} alt={b.alt}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding={i === 0 ? 'sync' : 'async'}
                  {...(i === 0 ? { fetchPriority: 'high' } : {})}
                />
              </picture>
            )}
          </a>
        ))}
      </div>

      <button className="hbanner__arrow hbanner__arrow--prev" aria-label="Previous slide" onClick={prev}>‹</button>
      <button className="hbanner__arrow hbanner__arrow--next" aria-label="Next slide" onClick={next}>›</button>

      <div className="hbanner__dots" role="tablist" aria-label="Choose slide">
        {BANNERS.map((b, i) => (
          <button
            key={b.id}
            className={`hbanner__dot${i === index ? ' is-on' : ''}`}
            role="tab" aria-selected={i === index} aria-label={`Slide ${i + 1}`}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </section>
  )
}
