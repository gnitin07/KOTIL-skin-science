import { useState, useEffect } from 'react'

// Safari only shipped requestIdleCallback recently; a timeout is a fine stand-in
// here because the work being deferred is a single setState.
const idle = (fn) =>
  typeof requestIdleCallback === 'function'
    ? requestIdleCallback(fn, { timeout: 2000 })
    : setTimeout(fn, 300)

const cancelIdle = (id) =>
  typeof cancelIdleCallback === 'function' ? cancelIdleCallback(id) : clearTimeout(id)

/**
 * Which carousel slides should actually have their <img> in the DOM.
 *
 * Both carousels keep every slide mounted and hide the inactive ones, so
 * loading="lazy" is useless on them: an image inside a visibility:hidden or
 * translated-away box either never intersects (and stays blank forever) or
 * counts as visible and downloads anyway. Either way the browser fetches all
 * four during first paint.
 *
 * So gate it in JS instead. The active slide is revealed immediately; its
 * successor is pulled in on the next idle tick, which is many seconds before
 * the 4–5s auto-advance needs it. Slides are never un-revealed — dropping an
 * img back out would re-decode it on the way back round.
 */
export function useRevealed(index, count) {
  const [seen, setSeen] = useState(() => new Set([index]))

  useEffect(() => {
    setSeen((prev) => (prev.has(index) ? prev : new Set(prev).add(index)))
  }, [index])

  useEffect(() => {
    const next = (index + 1) % count
    const id = idle(() => setSeen((prev) => (prev.has(next) ? prev : new Set(prev).add(next))))
    return () => cancelIdle(id)
  }, [index, count])

  return seen
}
