import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * Every scroll animation on the site: Lenis smooth scroll, the pinned machine
 * rig, the horizontal treatments track, parallax, reveals and count-ups.
 *
 * Animations are kept OUT of the markup on purpose: GSAP targets global class
 * selectors (.rig__machine, .hero__team, …), so the components stay pure JSX
 * and all timing/behaviour lives in one auditable place.
 *
 * @param {React.RefObject} root    scope element (everything renders inside it)
 * @param {React.RefObject} lenisRef filled with the Lenis instance so modals can stop()/start() it
 */
export function useSiteAnimations(root, lenisRef) {
  useGSAP(() => {
    // ---- smooth scroll ----
    // Smooth scroll is a DESKTOP-only enhancement. On touch devices it fights the
    // OS's native momentum scrolling and makes the page feel heavy/laggy, so we
    // simply let the browser scroll natively there.
    const useSmoothScroll = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let lenis = null
    let raf = null

    if (useSmoothScroll) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 })
      lenisRef.current = lenis
      lenis.on('scroll', ScrollTrigger.update)
      raf = (time) => { lenis.raf(time * 1000) }
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
    }
    if (import.meta.env.DEV) { window.__lenis = lenis; window.__gsap = gsap; window.__ST = ScrollTrigger }

    // ---- navbar solidify ----
    ScrollTrigger.create({
      start: 'top -80', end: 99999,
      onUpdate: (self) => {
        document.querySelector('.nav')?.classList.toggle('scrolled', self.scroll() > 80)
      },
    })

    // ---- hero intro on load: everything animates in automatically, incl. the
    // treatment cutout (she slides in on refresh — NO scroll needed). ----
    // Each element is animated by EITHER the intro or the scroll parallax, never
    // both. The intro animates the <img> .hero__team; the parallax animates the
    // parent .hero__media — different nodes, so the scrub can't stomp the intro.
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.hero__wordmark .line', { yPercent: 115, duration: 1.2, ease: 'power4.out' }, 0)
      .from('.hero__team', { autoAlpha: 0, xPercent: 8, yPercent: 8, scale: 0.95, duration: 1.3 }, 0.2)
      .from('.hero__tag', { y: 20, autoAlpha: 0, duration: 0.8 }, 0.4)
      .from('.hero__copy p', { y: 26, autoAlpha: 0, duration: 0.9 }, 0.52)
      .from('.hero__btns', { y: 26, autoAlpha: 0, duration: 0.9 }, 0.64)
      .from('.scroll-hint', { autoAlpha: 0, duration: 0.6 }, 0.85)

    // ---- hero: parallax out on scroll (wordmark drifts slower = depth) ----
    // Parallax drives .hero__media (the container), leaving .hero__team (the img)
    // free for the intro above.
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } })
      .to('.hero__wordmark', { yPercent: -26, opacity: 0.25, ease: 'none' }, 0)
      .to('.hero__media', { yPercent: 12, scale: 1.06, ease: 'none' }, 0)
      .to('.hero__copy', { yPercent: -55, opacity: 0, ease: 'none' }, 0)

    // ================= MACHINE RIG: auto-advancing carousel =================
    // Deliberately NOT scroll-pinned. Pinning + scrubbing hijacks the scroll,
    // which feels broken on touch devices — you have to "scroll through" the
    // section instead of just reading it. This plays itself instead.
    const machines = gsap.utils.toArray('.rig__machine')
    const slides = gsap.utils.toArray('.rig__slide')
    const dots = gsap.utils.toArray('.rig__dot')
    const count = machines.length
    const SLIDE_MS = 3000
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let current = 0
    let timer = null
    // Default TRUE: the observer below is only an optimisation to pause when the
    // section is off-screen. If IntersectionObserver never delivers (throttled or
    // background tabs don't always fire it) the carousel must still play, so we
    // start optimistically and let the observer switch it off.
    let inView = true
    let paused = false

    const paint = (i) => {
      machines.forEach((m, k) => gsap.set(m, { autoAlpha: k === i ? 1 : 0, xPercent: k === i ? 0 : 14, scale: k === i ? 1 : 0.9, rotate: 0 }))
      slides.forEach((s, k) => gsap.set(s, { autoAlpha: k === i ? 1 : 0, yPercent: k === i ? 0 : 40 }))
      dots.forEach((d, k) => {
        d.classList.toggle('is-on', k === i)
        d.setAttribute('aria-selected', String(k === i))
      })
    }
    paint(0)

    /** Cross-fade to slide `next` (wraps). */
    const goTo = (next) => {
      if (next === current || count < 2) return
      const prev = current
      current = (next + count) % count
      const D = reduceMotion ? 0 : 0.6
      gsap.to(machines[prev], { autoAlpha: 0, xPercent: -14, scale: 0.9, rotate: -2, duration: D, ease: 'power2.inOut' })
      gsap.fromTo(machines[current],
        { autoAlpha: 0, xPercent: 14, scale: 0.9, rotate: 2 },
        { autoAlpha: 1, xPercent: 0, scale: 1, rotate: 0, duration: D, ease: 'power2.inOut' })
      gsap.to(slides[prev], { autoAlpha: 0, yPercent: -40, duration: D, ease: 'power2.inOut' })
      gsap.fromTo(slides[current],
        { autoAlpha: 0, yPercent: 40 },
        { autoAlpha: 1, yPercent: 0, duration: D, ease: 'power2.inOut' })
      dots.forEach((d, k) => {
        d.classList.toggle('is-on', k === current)
        d.setAttribute('aria-selected', String(k === current))
      })
    }

    const stopAuto = () => { clearInterval(timer); timer = null }
    const startAuto = () => {
      stopAuto()
      // only run while the section is actually on screen and not being touched
      if (!inView || paused || count < 2) return
      timer = setInterval(() => goTo(current + 1), SLIDE_MS)
    }

    // pause when off-screen so we aren't animating invisible things
    const rigEl = document.querySelector('.rig')
    const io = rigEl && new IntersectionObserver(
      ([e]) => { inView = e.isIntersecting; startAuto() },
      { threshold: 0.25 }
    )
    io?.observe(rigEl)

    startAuto() // begin immediately; the observer only ever pauses it

    // pause on hover/touch so a reader isn't yanked mid-sentence
    const hold = () => { paused = true; stopAuto() }
    const release = () => { paused = false; startAuto() }
    const stage = document.querySelector('.rig__inner')
    stage?.addEventListener('mouseenter', hold)
    stage?.addEventListener('mouseleave', release)
    stage?.addEventListener('touchstart', hold, { passive: true })
    stage?.addEventListener('touchend', release, { passive: true })

    // dots are real controls
    const onDot = (i) => () => { goTo(i); paused = false; startAuto() }
    const dotHandlers = dots.map((d, i) => { const h = onDot(i); d.addEventListener('click', h); return h })

    // gentle idle float on the whole stage
    gsap.to('.rig__stage', { y: -16, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true })
    // rotating glow puck behind the machine
    gsap.to('.rig__halo', { rotate: 360, duration: 26, ease: 'none', repeat: -1 })

    // ---- marquee: base loop + scroll velocity skew ----
    const marqueeTween = gsap.to('.marquee__row', { xPercent: -50, repeat: -1, duration: 18, ease: 'none' })
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = gsap.utils.clamp(-3, 3, self.getVelocity() / -320)
        gsap.to(marqueeTween, { timeScale: 1 + Math.abs(v) })
        gsap.to('.marquee__row span', { skewX: v * 2, duration: 0.4, overwrite: true })
      },
    })

    // (the "Real Radiance" glow section was removed; its timelines went with it)

    // ---- treatments: native swipeable row (no pin) ----
    // Was a pinned horizontal scrub; same reason as the machine rig, it hijacked
    // the scroll gesture. Now it's an ordinary overflow-x row the user can swipe
    // or drag, with arrow buttons for mouse users.
    const treatTrack = document.querySelector('.treat__track')
    // Card-aware paging: snap to the next/previous card's own offset rather than
    // nudging by a pixel guess, so scroll-snap can't leave us mid-card.
    const nudgeTreat = (dir) => {
      if (!treatTrack) return
      // scrollLeft is measured from the content edge, which INCLUDES the track's
      // left padding — subtract it or every target is off by one gutter and the
      // snap yanks the row back.
      const padL = parseFloat(getComputedStyle(treatTrack).paddingLeft) || 0
      const lefts = [...treatTrack.children].map((c) => c.offsetLeft - treatTrack.offsetLeft - padL)
      const here = treatTrack.scrollLeft
      const target = dir > 0
        ? lefts.find((l) => l > here + 8)
        : [...lefts].reverse().find((l) => l < here - 8)
      treatTrack.scrollTo({ left: target ?? (dir > 0 ? treatTrack.scrollWidth : 0), behavior: 'smooth' })
    }
    const treatPrev = document.querySelector('.treat__arrow--prev')
    const treatNext = document.querySelector('.treat__arrow--next')
    const onTreatPrev = () => nudgeTreat(-1)
    const onTreatNext = () => nudgeTreat(1)
    treatPrev?.addEventListener('click', onTreatPrev)
    treatNext?.addEventListener('click', onTreatNext)

    // fade the arrows out at each end so the affordance stays honest
    const syncTreatArrows = () => {
      if (!treatTrack) return
      const max = treatTrack.scrollWidth - treatTrack.clientWidth
      treatPrev?.classList.toggle('is-off', treatTrack.scrollLeft <= 4)
      treatNext?.classList.toggle('is-off', treatTrack.scrollLeft >= max - 4)
    }
    treatTrack?.addEventListener('scroll', syncTreatArrows, { passive: true })
    syncTreatArrows()

    // ---- trust badges: staggered card reveal ----
    // (was a numeric count-up; the badges now read "US FDA" / "4.5 / 5" etc,
    // so counting no longer applies)
    gsap.from('.stats__head > *', {
      y: 26, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.stats', start: 'top 82%' },
    })
    gsap.from('.stat', {
      y: 28, autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.stats__grid', start: 'top 85%' },
    })

    // ---- reveals for reviews / faq / visit ----
    const revealBatch = (selector, trigger) => {
      gsap.from(selector, {
        y: 40, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: trigger || selector, start: 'top 82%' },
      })
    }
    revealBatch('.results__head > *', '.results')
    revealBatch('.rcard', '.results__grid')
    revealBatch('.vids__head > *', '.vids')
    revealBatch('.vcard', '.vids__grid')
    revealBatch('.gallery__head > *', '.gallery')
    revealBatch('.gtile', '.gallery__grid')
    revealBatch('.reviews__head > *', '.reviews')
    revealBatch('.review', '.reviews__track')
    revealBatch('.reviews__cta', '.reviews__cta')
    revealBatch('.faq__head > *', '.faq')
    revealBatch('.faq__item', '.faq__grid')
    revealBatch('.visit__copy > *', '.visit')
    gsap.from('.visit__map', {
      xPercent: 6, autoAlpha: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.visit', start: 'top 72%' },
    })

    // ---- cta headline reveal ----
    gsap.from('.cta h2 span', {
      scrollTrigger: { trigger: '.cta', start: 'top 60%' },
      yPercent: 115, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'power4.out',
    })

    // Images and the display webfont both land AFTER this effect runs, and both reflow
    // the page. Without re-measuring, every pin/trigger keeps its stale numbers and the
    // rig pin collapses to zero length (machines never switch). Wait for both, then
    // re-measure on the next frame so the swapped font has actually laid out.
    // Native "#tech" anchor jumps teleport the scroller, which drops you inside a
    // pinned section at an arbitrary offset and reads as a broken/gappy jump.
    // Route every in-page link through Lenis so pins engage normally.
    const onAnchorClick = (e) => {
      const link = e.target.closest('a[href^="#"]')
      if (!link) return
      const id = link.getAttribute('href')
      if (!id || id === '#') return
      const target = document.querySelector(id)
      if (!target) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(target, { offset: -1, duration: 1.1 })
      else target.scrollIntoView({ behavior: 'smooth', block: 'start' }) // native path (touch)
    }
    document.addEventListener('click', onAnchorClick)

    const refresh = () => ScrollTrigger.refresh()
    const imgs = Array.from(document.images)
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      ...imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = res }))),
      // NB: refresh directly — do NOT defer via requestAnimationFrame. In a
      // backgrounded/throttled tab rAF may never fire, so the refresh silently
      // never happens and the rig pin stays broken.
    ]).then(() => { refresh(); setTimeout(refresh, 250) })
    if (document.readyState === 'complete') refresh()
    else window.addEventListener('load', refresh)

    return () => {
      document.removeEventListener('click', onAnchorClick)
      window.removeEventListener('load', refresh)
      // carousel teardown (useGSAP only reverts GSAP, not DOM listeners/timers)
      stopAuto()
      io?.disconnect()
      stage?.removeEventListener('mouseenter', hold)
      stage?.removeEventListener('mouseleave', release)
      stage?.removeEventListener('touchstart', hold)
      stage?.removeEventListener('touchend', release)
      dots.forEach((d, i) => d.removeEventListener('click', dotHandlers[i]))
      treatPrev?.removeEventListener('click', onTreatPrev)
      treatNext?.removeEventListener('click', onTreatNext)
      treatTrack?.removeEventListener('scroll', syncTreatArrows)
      if (raf) gsap.ticker.remove(raf)
      lenis?.destroy()
    }
  }, { scope: root })
}
