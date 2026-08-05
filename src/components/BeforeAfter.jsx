import { useRef, useState, useCallback } from 'react'
import Img from './Img.jsx'

/**
 * Draggable before/after comparison.
 *
 * The "after" photo is the base layer and the "before" photo sits on top,
 * clipped to the handle position with clip-path. Clipping (rather than sizing a
 * wrapper) keeps the top image at full frame width, so it never squashes as the
 * handle moves.
 *
 * Pointer events cover mouse, touch and pen in one path; setPointerCapture
 * keeps the drag alive when the cursor leaves the frame.
 */
export default function BeforeAfter({ before, after, alt, label, width, height }) {
  const [pos, setPos] = useState(50)
  const frame = useRef(null)
  const dragging = useRef(false)

  const setFromX = useCallback((clientX) => {
    const el = frame.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }, [])

  const onPointerDown = (e) => {
    dragging.current = true
    // Move first, capture second. setPointerCapture throws if the browser has
    // no active pointer for that id, and when it ran first that exception
    // aborted the handler, so a tap never repositioned the handle at all.
    setFromX(e.clientX)
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* capture is an enhancement, not a requirement */ }
  }
  const onPointerMove = (e) => { if (dragging.current) setFromX(e.clientX) }
  const stop = (e) => {
    dragging.current = false
    try { e.currentTarget.releasePointerCapture?.(e.pointerId) } catch { /* already released */ }
  }

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 4
    const move = { ArrowLeft: -step, ArrowRight: step, Home: -100, End: 100 }[e.key]
    if (move === undefined) return
    e.preventDefault()
    setPos((p) => Math.min(100, Math.max(0, p + move)))
  }

  return (
    <figure className="ba">
      <div
        ref={frame}
        className="ba__frame"
        style={{ aspectRatio: `${width} / ${height}`, '--pos': `${pos}%` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
        onKeyDown={onKeyDown}
        role="slider"
        tabIndex={0}
        aria-label={`${label}: drag to compare before and after`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
      >
        <Img className="ba__img" src={after} alt={`${alt}, after treatment`} draggable="false" width={width} height={height} />
        <Img className="ba__img ba__img--before" src={before} alt={`${alt}, before treatment`} draggable="false" width={width} height={height} />
        <span className="ba__tag ba__tag--before">Before</span>
        <span className="ba__tag ba__tag--after">After</span>
        <span className="ba__handle" aria-hidden="true"><span className="ba__grip" /></span>
      </div>
      <figcaption className="ba__cap">{label}</figcaption>
    </figure>
  )
}
