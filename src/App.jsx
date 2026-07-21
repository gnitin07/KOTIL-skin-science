import { useRef, useState, useEffect, useCallback } from 'react'
import { useSiteAnimations } from './animations.js'
import { MACHINES, TREATMENTS, STATS, REVIEWS, REVIEW_RATING, FAQS, GALLERY, ALL_TREATMENTS } from './data.js'
import { CLINIC, SOCIALS, telLink, mailLink, bookLink, enquireLink, directionsLink, mapEmbedSrc } from './config.js'
import { GoogleG, SOCIAL_ICONS, STAT_ICONS } from './components/icons.jsx'

export default function App() {
  const root = useRef(null)
  // Lenis owns wheel/touch scrolling globally. Any modal must stop() it, or the
  // page keeps scrolling behind the dialog and the dialog itself won't scroll.
  const lenisRef = useRef(null)

  // ---- mobile nav ----
  const [menuOpen, setMenuOpen] = useState(false)

  // ---- "all treatments" panel ----
  const [allOpen, setAllOpen] = useState(false)
  useEffect(() => {
    if (!allOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setAllOpen(false) }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    lenisRef.current?.stop()          // hand scrolling over to the dialog
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      lenisRef.current?.start()
    }
  }, [allOpen])

  // ---- clinic gallery lightbox ----
  const [lightbox, setLightbox] = useState(null) // index or null
  const openLb = (i) => setLightbox(i)
  const closeLb = useCallback(() => setLightbox(null), [])
  const stepLb = useCallback((dir) => {
    setLightbox((i) => (i === null ? i : (i + dir + GALLERY.length) % GALLERY.length))
  }, [])

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeLb()
      else if (e.key === 'ArrowRight') stepLb(1)
      else if (e.key === 'ArrowLeft') stepLb(-1)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden' // lock scroll while open
    lenisRef.current?.stop()                // else the page scrolls behind it
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      lenisRef.current?.start()
    }
  }, [lightbox, closeLb, stepLb])

  useSiteAnimations(root, lenisRef)

  return (
    <div ref={root}>
      {/* NAV */}
      <nav className="nav">
        <a className="nav__logo" href="#home" aria-label="Kotil Skin Science home">
          <img src="/assets/kotil-logo-light.png" alt="Kotil Skin Science" />
        </a>
        <div className={`nav__links${menuOpen ? ' is-open' : ''}`} onClick={() => setMenuOpen(false)}>
          <a href="#home">Home</a><a href="#tech">Technology</a>
          <a href="#treatments">Treatments</a><a href="#gallery">Gallery</a>
          <a href="#reviews">Reviews</a><a href="#faq">FAQ</a><a href="#contact">Contact</a>
        </div>
        <div className="nav__right">
          <a className="nav__cta" href={telLink}>Call Now</a>
          <button
            className={`nav__burger${menuOpen ? ' is-open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          ><span /><span /><span /></button>
        </div>
      </nav>

      {/* HERO — one horizontal wordmark sitting BEHIND the machines */}
      <section className="hero" id="home">
        <div className="hero__bg" /><div className="hero__grid" />

        <h1 className="hero__wordmark">
          <span className="mask"><span className="line">KOTIL SKIN SCIENCE</span></span>
        </h1>

        <div className="hero__inner">
          <div className="hero__copy">
            <span className="hero__tag">Delhi · Nirman Vihar</span>
            <p>Real machines. Real experts. Doctor-led skin, hair &amp; body care. Diagnosis first, always.</p>
            <div className="hero__btns">
              <a className="btn-primary" href={telLink}>☏ Call Now</a>
              <a className="btn-ghost" href="#tech">See our tech</a>
            </div>
          </div>
          <div className="hero__media">
            <img className="hero__team" src="/assets/hero-treatment.webp" alt="Kotil dermatologist performing a laser skin treatment on a patient" />
          </div>
        </div>
        <div className="scroll-hint">Scroll</div>
      </section>

      {/* MACHINE RIG — switches as you scroll */}
      <section className="rig" id="tech">
        <div className="rig__inner">
          <div className="rig__head">
            <span className="kicker">Our Technology</span>
            <h2>The machines behind the results</h2>
          </div>

          <div className="rig__stage">
            <div className="rig__halo" />
            {MACHINES.map((m) => (
              <img className="rig__machine" key={m.id} src={m.img} alt={`${m.name}, ${m.tag}`} />
            ))}
            <div className="rig__shadow" />
          </div>

          <div className="rig__copy">
            {MACHINES.map((m, i) => (
              <div className="rig__slide" key={m.id}>
                <span className="rig__num">{String(i + 1).padStart(2, '0')} / {String(MACHINES.length).padStart(2, '0')}</span>
                <span className="rig__tag">{m.tag}</span>
                <h3>{m.name}</h3>
                <p>{m.desc}</p>
              </div>
            ))}
          </div>

          <div className="rig__dots" role="tablist" aria-label="Choose a machine">
            {MACHINES.map((m) => (
              <button className="rig__dot" key={m.id} role="tab" aria-label={m.name} />
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="marquee">
        <div className="marquee__row">
          {Array.from({ length: 2 }).map((_, r) => (
            <span key={r}>Glowing Skin <i /> Healthy Hair <i /> Radiant You <i /> Doctor Led <i />&nbsp;</span>
          ))}
        </div>
      </section>

      {/* GLOW */}
      <section className="glow" id="glow">
        <div className="glow__img"><img src="/assets/glow.webp" alt="Radiant skin" /></div>
        <div className="glow__veil" />
        <div className="glow__word">
          <h2><span>Real</span> <em><span>Radiance.</span></em></h2>
          <p>We don't believe in random treatments. Every plan starts with a diagnosis and is tailored to your unique skin type.</p>
        </div>
      </section>

      {/* TREATMENTS */}
      <section className="treat" id="treatments">
        <div className="treat__head">
          <div className="kicker">Our Signature Treatments</div>
          <h2>Doctor-led. Visibly better.</h2>
          <p className="treat__hint"><span className="treat__hint-ico">⇢</span> Slide to see all treatments</p>
        </div>
        <div className="treat__pin">
          <button className="treat__arrow treat__arrow--prev" aria-label="Previous treatments">‹</button>
          <button className="treat__arrow treat__arrow--next" aria-label="Next treatments">›</button>
          {/* data-lenis-prevent: let the browser handle horizontal wheel/trackpad
              scrolling here instead of Lenis swallowing the event */}
          <div className="treat__track" data-lenis-prevent>
            {TREATMENTS.map((t) => (
              <article className="card" key={t.title}>
                <img src={t.img} alt={t.title} />
                <div className="card__grad" />
                <span className="card__off">{t.off}</span>
                <div className="card__body">
                  <h3>{t.title}</h3><p>{t.desc}</p>
                  <a
                    className="card__book"
                    href={bookLink(t.title)}
                    target="_blank" rel="noopener noreferrer"
                  >Book appointment</a>
                </div>
              </article>
            ))}
            <button className="card card--more" onClick={() => setAllOpen(true)} aria-label="See all treatments">
              <span className="card--more__ring">
                <span className="card--more__arrow">→</span>
              </span>
              <h3>See more</h3>
              <p>Browse all {ALL_TREATMENTS.reduce((n, g) => n + g.items.length, 0)} treatments we offer</p>
            </button>
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="stats">
        <div className="stats__grid">
          {STATS.map((s) => (
            <article className="stat" key={s.label}>
              <span className="stat__ico">{STAT_ICONS[s.icon]}</span>
              {/* the Google card reads its score from REVIEW_RATING so it can
                  never disagree with the reviews section */}
              <h4>{s.value ?? `${REVIEW_RATING.score} / 5`}</h4>
              <p>{s.label}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CLINIC GALLERY (bento) */}
      <section className="gallery" id="gallery">
        <div className="gallery__head">
          <div className="kicker">Inside Kotil</div>
          <h2>Our Clinic Gallery</h2>
          <p>Take a look inside our reception, private treatment rooms and advanced technology.</p>
        </div>
        <div className="gallery__grid">
          {GALLERY.map((g, i) => (
            <button className={`gtile gtile--${g.cls}`} key={g.src} onClick={() => openLb(i)} aria-label={`Open photo: ${g.alt}`}>
              <img src={g.src} alt={g.alt} />
              <span className="gtile__zoom" aria-hidden>⤢</span>
            </button>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="reviews" id="reviews">
        <div className="reviews__head">
          <div className="kicker">What clients say on Google</div>
          <h2>Real results, in their words.</h2>
          <div className="reviews__rating">
            <span className="reviews__score">{REVIEW_RATING.score}</span>
            <span className="reviews__stars" aria-label="4.5 out of 5">★★★★★</span>
            <span className="reviews__count">Based on {REVIEW_RATING.count} reviews on</span>
            <GoogleG size={20} />
            <span className="reviews__gword">Google</span>
          </div>
        </div>

        <div className="reviews__wrap">
          <button className="reviews__arrow reviews__arrow--prev" aria-label="Previous reviews"
            onClick={() => document.querySelector('.reviews__track')?.scrollBy({ left: -380, behavior: 'smooth' })}>‹</button>
          <div className="reviews__track">
            {REVIEWS.map((r) => (
              <article className="review" key={r.name}>
                <div className="review__top">
                  <span className="review__avatar">{r.name[0]}</span>
                  <div>
                    <p className="review__name">{r.name}</p>
                    <p className="review__meta">{r.when} · Google</p>
                  </div>
                  <span className="review__g"><GoogleG size={22} /></span>
                </div>
                <div className="review__stars">{'★'.repeat(r.stars)}</div>
                <p className="review__text">“{r.text}”</p>
                <div className="review__foot"><GoogleG size={16} /> Posted on Google</div>
              </article>
            ))}
          </div>
          <button className="reviews__arrow reviews__arrow--next" aria-label="Next reviews"
            onClick={() => document.querySelector('.reviews__track')?.scrollBy({ left: 380, behavior: 'smooth' })}>›</button>
        </div>

        <div className="reviews__cta">
          <a className="btn-primary reviews__gbtn" href={REVIEW_RATING.url} target="_blank" rel="noopener noreferrer"><GoogleG size={20} /> Read all {REVIEW_RATING.count}+ reviews on Google</a>
          <a className="btn-ghost" href={REVIEW_RATING.url} target="_blank" rel="noopener noreferrer">✎ Write a review</a>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq">
        <div className="faq__head">
          <div className="kicker">Frequently asked questions</div>
          <h2>Kotil Skin Science FAQ</h2>
          <p>Clear answers about our expert-led skin, hair, laser and body treatments in Preet Vihar, East Delhi.</p>
        </div>
        <div className="faq__grid">
          {FAQS.map((f) => (
            <details className="faq__item" key={f.q}>
              <summary>{f.q}<span className="faq__icon" aria-hidden /></summary>
              <div className="faq__ans"><p>{f.a}</p></div>
            </details>
          ))}
        </div>
      </section>

      {/* VISIT US / MAP */}
      <section className="visit" id="contact">
        <div className="visit__inner">
          <div className="visit__copy">
            <div className="kicker">Visit us</div>
            <h2>Meet us in person at our <em>Delhi centre</em></h2>
            <p>Prefer a face-to-face consultation? You're warmly welcome at our clinic. Sit down with our doctors, discuss your skin and hair concerns, and get a clear, personalised plan, in a calm, private setting.</p>
            <ul className="visit__points">
              <li><span className="visit__ico">📍</span><div><strong>{CLINIC.address.line1}, {CLINIC.address.line2}</strong><p>Near Nirman Vihar &amp; Laxmi Nagar. Easy to reach, comfortable and hygienic.</p></div></li>
              <li><span className="visit__ico">🗓️</span><div><strong>By prior appointment</strong><p>Sessions are scheduled in advance so you get undivided attention.</p></div></li>
              <li><span className="visit__ico">☎️</span><div><strong>Call / WhatsApp</strong><p>{CLINIC.phoneDisplay}. We'll guide you with directions and timings.</p></div></li>
            </ul>
            <div className="visit__btns">
              <a className="btn-primary" href={directionsLink} target="_blank" rel="noopener noreferrer">Get directions ↗</a>
              <a className="btn-ghost" href={enquireLink} target="_blank" rel="noopener noreferrer">Book appointment</a>
            </div>
          </div>
          <div className="visit__map">
            <iframe
              title={`${CLINIC.name} location`}
              src={mapEmbedSrc}
              loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="kicker">Consultation First</div>
        <h2><span>Book your</span> <span><em>glow-up.</em></span></h2>
        <div className="cta__btns">
          <a className="btn-primary" href={telLink}>☏ Call Now</a>
          <a className="btn-ghost" href={enquireLink} target="_blank" rel="noopener noreferrer">✆ WhatsApp Appointment</a>
        </div>
      </section>
      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__main">
          <div className="footer__brand">
            <img src="/assets/kotil-logo-light.png" alt="Kotil Skin Science" />
            <p>Consultation-first skin, hair &amp; body care. Diagnosis before products, always.</p>
          </div>

          <nav className="footer__col" aria-label="Quick links">
            <h4>Quick Links</h4>
            <a href="#home">Home</a>
            <a href="#tech">Technology</a>
            <a href="#treatments">Treatments</a>
            <a href="#reviews">Reviews</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="footer__col footer__contact">
            <h4>Contact</h4>
            <p className="footer__addr">{CLINIC.address.line1},<br />{CLINIC.address.line2}</p>
            <a href={telLink}>{CLINIC.phoneDisplay}</a>
            <a href={mailLink}>{CLINIC.email}</a>
          </div>
        </div>

        <div className="footer__social">
          <span>Follow Us</span>
          <div className="footer__icons">
            {SOCIALS.map((sn) => (
              <a key={sn.id} href={sn.url} target="_blank" rel="noopener noreferrer"
                 aria-label={`${CLINIC.name} on ${sn.label}`} className={`soc soc--${sn.id}`}>
                {SOCIAL_ICONS[sn.id]}
              </a>
            ))}
          </div>
        </div>

        <div className="footer__bottom">
          <span>© 2026 Kotil Skin Science. All rights reserved.</span>
          <span><a href="#">Privacy Policy</a> · <a href="#">Terms &amp; Conditions</a></span>
        </div>
      </footer>

      {/* ALL TREATMENTS PANEL */}
      {allOpen && (
        <div className="allt" role="dialog" aria-modal="true" aria-label="All treatments" onClick={() => setAllOpen(false)}>
          <div className="allt__sheet" onClick={(e) => e.stopPropagation()}>
            <header className="allt__head">
              <div>
                <span className="kicker">Our full menu</span>
                <h3>All treatments</h3>
              </div>
              <button className="allt__close" aria-label="Close" onClick={() => setAllOpen(false)}>×</button>
            </header>
            {/* data-lenis-prevent: Lenis preventDefault()s wheel events globally, which
                blocks native scrolling inside nested scrollers even when stopped. This
                attribute makes Lenis ignore events originating here. */}
            <div className="allt__body" data-lenis-prevent>
              {ALL_TREATMENTS.map((g) => (
                <section className="allt__group" key={g.group}>
                  <h4>{g.group}<span>{g.items.length}</span></h4>
                  <div className="allt__grid">
                    {g.items.map((t) => (
                      <article className="tcard" key={t.name}>
                        <div className="tcard__media">
                          {/* no loading="lazy": the modal is conditionally rendered, so these
                              only mount when it opens — and lazy stops them loading in-modal. */}
                          <img src={t.img} alt={t.name} />
                          <span className="tcard__off">{t.off}</span>
                        </div>
                        <div className="tcard__body">
                          <h5>{t.name}</h5>
                          <p>{t.desc}</p>
                          <div className="tcard__actions">
                            <a
                              className="tcard__book"
                              href={bookLink(t.name)}
                              target="_blank" rel="noopener noreferrer"
                            >Book appointment</a>
                            <a
                              className="tcard__enq"
                              href={telLink}
                              aria-label={`Call about ${t.name}`}
                            >☏</a>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <footer className="allt__foot">
              <a className="btn-primary" href={telLink}>☏ Call to book</a>
              <a className="btn-ghost" href={enquireLink} target="_blank" rel="noopener noreferrer">✆ WhatsApp us</a>
            </footer>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox !== null && (
        <div className="lb" role="dialog" aria-modal="true" aria-label="Clinic photo viewer" onClick={closeLb} data-lenis-prevent>
          <button className="lb__close" aria-label="Close" onClick={closeLb}>×</button>
          <button className="lb__nav lb__nav--prev" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); stepLb(-1) }}>‹</button>
          <figure className="lb__stage" onClick={(e) => e.stopPropagation()}>
            <img src={GALLERY[lightbox].src} alt={GALLERY[lightbox].alt} />
            <figcaption>{GALLERY[lightbox].alt}<span className="lb__count">{lightbox + 1} / {GALLERY.length}</span></figcaption>
          </figure>
          <button className="lb__nav lb__nav--next" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); stepLb(1) }}>›</button>
        </div>
      )}
    </div>
  )
}
