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
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => { lenis.raf(time * 1000) }
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
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

    // ================= MACHINE RIG: pinned, machines switch on scroll =================
    const machines = gsap.utils.toArray('.rig__machine')
    const slides = gsap.utils.toArray('.rig__slide')
    const dots = gsap.utils.toArray('.rig__dot')
    const count = machines.length

    // initial state: only first visible
    machines.forEach((m, i) => gsap.set(m, { autoAlpha: i === 0 ? 1 : 0, xPercent: i === 0 ? 0 : 14, scale: i === 0 ? 1 : 0.9 }))
    slides.forEach((s, i) => gsap.set(s, { autoAlpha: i === 0 ? 1 : 0, yPercent: i === 0 ? 0 : 40 }))
    dots.forEach((d, i) => d.classList.toggle('is-on', i === 0))

    const rigTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.rig',
        start: 'top top',
        // Whole rig completes in ~one full viewport scroll. It used to be
        // `innerHeight * count` (5 viewports = 3600px), which needed 4-5 wheel
        // scrolls to get through all five machines.
        end: () => '+=' + window.innerHeight,
        pin: '.rig__inner',
        // `transform` pinning instead of position:fixed. Fixed-position pinning makes
        // the element shrink-to-fit, and if it's measured before layout settles GSAP
        // bakes a garbage inline width (we saw 40px) that collapses the grid to 0px
        // columns. transform pinning keeps the element in flow at its natural width.
        pinType: 'transform',
        anticipatePin: 1,
        scrub: 0.4, // snappier: less lag between wheel and machine swap
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // light up the dot for the current machine
          const idx = Math.min(count - 1, Math.round(self.progress * (count - 1)))
          dots.forEach((d, i) => d.classList.toggle('is-on', i === idx))
        },
      },
    })

    for (let i = 1; i < count; i++) {
      rigTl
        .to(machines[i - 1], { autoAlpha: 0, xPercent: -14, scale: 0.9, rotate: -2, ease: 'power2.inOut' }, i)
        .fromTo(machines[i],
          { autoAlpha: 0, xPercent: 14, scale: 0.9, rotate: 2 },
          { autoAlpha: 1, xPercent: 0, scale: 1, rotate: 0, ease: 'power2.inOut' }, i)
        .to(slides[i - 1], { autoAlpha: 0, yPercent: -40, ease: 'power2.inOut' }, i)
        .fromTo(slides[i],
          { autoAlpha: 0, yPercent: 40 },
          { autoAlpha: 1, yPercent: 0, ease: 'power2.inOut' }, i)
    }

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

    // ---- glow: image parallax zoom + word reveal ----
    gsap.timeline({ scrollTrigger: { trigger: '.glow', start: 'top bottom', end: 'bottom top', scrub: 1 } })
      .fromTo('.glow__img img', { scale: 1.35, yPercent: -6 }, { scale: 1.05, yPercent: 6, ease: 'none' }, 0)
    gsap.from('.glow__word h2 span', {
      scrollTrigger: { trigger: '.glow', start: 'top 65%' },
      yPercent: 120, opacity: 0, duration: 1.1, stagger: 0.14, ease: 'power4.out',
    })
    gsap.from('.glow__word p', {
      scrollTrigger: { trigger: '.glow', start: 'top 50%' },
      y: 30, opacity: 0, duration: 1, ease: 'power2.out',
    })

    // ---- treatments: horizontal pinned scroll ----
    const track = document.querySelector('.treat__track')
    if (track) {
      const amount = () => track.scrollWidth - window.innerWidth + window.innerWidth * 0.06
      gsap.to(track, {
        x: () => -amount(), ease: 'none',
        scrollTrigger: {
          trigger: '.treat__pin', start: 'top top',
          end: () => '+=' + amount(),
          pin: true, pinType: 'transform', anticipatePin: 1,
          scrub: 1, invalidateOnRefresh: true,
        },
      })
    }

    // ---- stats count-up ----
    gsap.utils.toArray('.stat h4').forEach((el) => {
      const target = +el.dataset.n
      const obj = { v: 0 }
      gsap.to(obj, {
        v: target, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate: () => { el.firstChild.textContent = Math.round(obj.v).toLocaleString() },
      })
    })

    // ---- reveals for reviews / faq / visit ----
    const revealBatch = (selector, trigger) => {
      gsap.from(selector, {
        y: 40, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: trigger || selector, start: 'top 82%' },
      })
    }
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
      lenis.scrollTo(target, { offset: -1, duration: 1.1 })
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
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, { scope: root })
}
