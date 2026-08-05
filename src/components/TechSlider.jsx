import { useState, useEffect, useRef, useCallback } from 'react'
import { MACHINES } from '../data.js'
import { useRevealed } from '../useRevealed.js'
import { useNearViewport } from '../useNearViewport.js'
import Img from './Img.jsx'

const SLIDE_MS = 5000

/**
 * Technology slider — copy left, machine photo right (stacks on mobile).
 * Self-contained like HeroBanner: own state/timer, plain CSS transitions.
 * Replaces the old GSAP "rig", whose floating-cutout stage spent most of its
 * height on empty space; this one is an ordinary compact block.
 * Auto-advances every 5s; pauses on hover/touch and off-screen; swipeable.
 */
export default function TechSlider() {
  const [index, setIndex] = useState(0)
  const count = MACHINES.length
  const revealed = useRevealed(index, count)
  // useRevealed alone still costs a machine photo (or several, since the timer
  // keeps advancing until the pause observer catches up) for a visitor who never
  // scrolls this far. Gate the whole stage on proximity as well.
  const [stageRef, stageNear] = useNearViewport()
  const timer = useRef(null)
  const paused = useRef(false)
  const inView = useRef(true) // optimistic: IO is only ever a pause optimisation
  const rootRef = useRef(null)
  const touchX = useRef(null)

  const go = useCallback((n) => setIndex(((n % count) + count) % count), [count])

  const stop = useCallback(() => { clearInterval(timer.current); timer.current = null }, [])
  const start = useCallback(() => {
    stop()
    if (paused.current || !inView.current || count < 2) return
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS)
  }, [stop, count])

  // restart on every slide change so a manual jump still waits a full cycle
  useEffect(() => { start(); return stop }, [index, start, stop])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { inView.current = e.isIntersecting; start() }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [start])

  const hold = () => { paused.current = true; stop() }
  const release = () => { paused.current = false; start() }
  const onTouchStart = (e) => { hold(); touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - (touchX.current ?? 0)
    if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1))
    release()
  }
  const onKey = (e) => {
    if (e.key === 'ArrowRight') go(index + 1)
    else if (e.key === 'ArrowLeft') go(index - 1)
  }

  return (
    <section
      className="tech" id="tech" ref={rootRef}
      onMouseEnter={hold} onMouseLeave={release}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      onKeyDown={onKey} tabIndex={0}
      aria-roledescription="carousel" aria-label="Our technology"
    >
      <div className="tech__head">
        <span className="kicker">Our Technology</span>
        <h2>The machines behind the results</h2>
      </div>

      <div className="tech__stage" ref={stageRef}>
        {MACHINES.map((m, i) => (
          <article
            className={`tech__slide${i === index ? ' is-active' : ''}`}
            key={m.id} aria-hidden={i !== index}
          >
            <div className="tech__copy">
              <span className="tech__num">{String(i + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
              <h3>{m.name}</h3>
              <span className="tech__tag">{m.tag}</span>
              <p className="tech__desc">{m.desc}</p>
              <ul className="tech__points">
                {m.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <p className="tech__usp"><strong>USP:</strong> {m.usp}</p>
              <div className="tech__badges">
                {m.badges.map((b) => <span className="tech__badge" key={b}>{b}</span>)}
              </div>
            </div>
            <div className="tech__media">
              {/* Still NOT lazy — inactive slides are visibility:hidden and a lazy
                  image inside a hidden box never intersects, so it would stay blank
                  forever (the same failure the gallery hit). useRevealed does the
                  gating instead: only the current slide (~100KB) is in the DOM at
                  first paint, the next arrives on an idle tick. */}
              {/* No width/height: each machine is a trimmed cut-out with its own
                  aspect ratio (979x882, 832x1000, ...) and .tech__media img sets
                  only max-width/max-height, so a fixed pair here would letterbox
                  the photo into the wrong box. Intrinsic dimensions are correct. */}
              {stageNear && revealed.has(i) && (
                <Img src={m.img} alt={`${m.name} — ${m.tag}`} loading="eager" />
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="tech__nav">
        <button className="tech__arrow" aria-label="Previous machine" onClick={() => { go(index - 1); release() }}>‹</button>
        <div className="tech__dots" role="tablist" aria-label="Choose a machine">
          {MACHINES.map((m, i) => (
            <button
              key={m.id} className={`tech__dot${i === index ? ' is-on' : ''}`}
              role="tab" aria-selected={i === index} aria-label={m.name}
              onClick={() => { go(i); release() }}
            />
          ))}
        </div>
        <button className="tech__arrow" aria-label="Next machine" onClick={() => { go(index + 1); release() }}>›</button>
      </div>
    </section>
  )
}
