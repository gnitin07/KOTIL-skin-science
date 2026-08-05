import { useEffect, useRef, useState } from 'react'

/**
 * "Is this container close enough to the viewport to be worth loading?"
 *
 * Why not just loading="lazy" on the images? Because the sections that hold
 * them (.gtile, .vcard, .rcard) are revealed by gsap.from({ autoAlpha: 0 }),
 * which parks them at visibility:hidden until their ScrollTrigger fires at
 * "top 82%" — i.e. once they are already on screen. A lazy image inside that
 * cannot begin downloading until the reveal has started, so the tile animates
 * in empty and the photo pops in afterwards. (animations.js also waits on
 * document.images before ScrollTrigger.refresh(); an image that never loads
 * can leave that promise pending.)
 *
 * The *containers* — .gallery__grid, .vids__grid, .treat__track — are never
 * hidden, only their children are. So observe the container with a generous
 * margin and mount the images eagerly once it is near. Nothing downloads for a
 * visitor who never scrolls that far, and for one who does the photos are
 * already decoded before the reveal plays.
 */
export function useNearViewport(rootMargin = '700px') {
  const ref = useRef(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    if (near) return
    const el = ref.current
    if (!el) return

    // No IntersectionObserver (very old browser) — just load, matching the
    // eager behaviour this replaced rather than showing nothing.
    if (typeof IntersectionObserver !== 'function') {
      setNear(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [near, rootMargin])

  return [ref, near]
}
