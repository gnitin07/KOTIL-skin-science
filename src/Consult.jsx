import { useEffect, useRef, useState, useCallback } from 'react'
import { CLINIC, telLink, waLink, enquireLink, directionsLink, mapEmbedSrc, hoursLine } from './config.js'
// proof.js, NOT data.js: importing from data.js dragged the whole 28-item
// treatment menu, the machine specs and the FAQ into this page's bundle for the
// sake of four reviews.
import { REVIEWS, REVIEW_RATING, COMPARISONS } from './proof.js'
// Shared with the main site so both pages pick AVIF the same way. It consults
// src/avif-manifest.json rather than assuming a twin exists — an .avif that
// 404s inside <picture> is a broken image, not a fallback to the WebP.
import Img from './components/Img.jsx'
import './consult.css'

/* ===========================================================================
   /consult — the ₹99 consultation landing page.
   ===========================================================================
   A single-purpose page for paid traffic: one offer, one action, nothing that
   leads away from it. It shares config.js and proof.js with the main site (so a
   phone number or a review is never entered twice) but NOT its stylesheet,
   GSAP or Lenis. It is its own Rollup entry — consult.html + consult-main.jsx —
   so an ad click downloads only what this page runs, right down to the
   preload hints.

   HOW A BOOKING FLOWS
     form submit → the lead row is posted to Apps Script AND Razorpay Checkout
                   opens, at the same time. The post is not awaited: a booking
                   must never wait on a spreadsheet, and someone who abandons
                   the payment screen is still a lead worth calling — they land
                   in the sheet as "Started (not paid)".
     payment ok  → Apps Script asks Razorpay's API whether that payment id is
                   real, is ours and is for ₹99, then marks the row Paid
                 → visitor is bounced to WhatsApp with the payment id and the
                   booking id, so a tele-counsellor can match them in the sheet.

   The backend is scripts/apps-script/kotil-99-consult.gs. The Razorpay SECRET
   lives only there — this file ships to the browser, so anything in it is
   public. The key id below is public by design.

   Until CONSULT.appsScriptUrl and CONSULT.razorpayKey are filled in, the form
   still works — it just hands the lead straight to WhatsApp instead of taking
   payment. Nothing here is a stub that breaks the page while empty.
   ======================================================================== */

export const CONSULT = {
  // ---- the offer -------------------------------------------------------
  price: 99,               // what they pay today, in ₹
  strike: 800,             // the usual consultation fee, shown struck through
  slotsLeft: 7,            // both numbers only drive the scarcity meter; keep
  slotsTotal: 40,          // them honest — update when the week turns over

  // ---- payment (filled in once the Apps Script is deployed) -------------
  // The Apps Script Web App /exec URL — Deploy ▸ New deployment ▸ Web app,
  // "Execute as: Me", "Who has access: Anyone". It owns the Razorpay secret
  // and the kotil@99 sheet; neither ever appears in this file.
  // Must be the /macros/s/… form and the deployment must be set to "Anyone".
  // The /a/macros/devrizhealthcare.in/… URL the editor hands a Workspace account
  // is domain-scoped: it bounces signed-out visitors to a Google login, so every
  // booking would silently fail to reach the sheet. Verified public by loading
  // this URL in a signed-out browser — it must return JSON, not a sign-in page.
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbzFoFhnA0Uz2GcodPNcLxPgFhOR4vMc6-G1xvXw09rzl-VfzsCd7JH7slBdr5JQ1ISm/exec',
  // Razorpay PUBLIC key id — the rzp_live_… one. Public by design: it only
  // identifies the account, it cannot move money on its own.
  razorpayKey: 'rzp_live_StwoxJlDC4IMUs',
  // Leave false. Flip it only if Razorpay starts rejecting payments with
  // "order_id is required", which means your account has the Orders API set to
  // mandatory. It costs an extra round trip to Apps Script before the payment
  // sheet can open, which is why it is not the default.
  useOrders: false,
}

const RZP_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

/* ---------------------------------------------------------------------------
   Content
   ------------------------------------------------------------------------ */

// What the pass buys. Deliberately concrete — "a written plan with real
// timelines" converts where "expert consultation" does not.
const INCLUDED = [
  'One-to-one sitting with the doctor',
  'Digital skin & scalp analysis',
  'A written plan with real timelines',
  'Upfront cost of every step, before you decide',
  `₹${CONSULT.price} adjusted into your first treatment`,
]

const TRUST = [
  { big: '15+', small: 'Years' },
  { big: '20K+', small: 'Patients' },
  { big: `${REVIEW_RATING.score}★`, small: 'Google' },
  { big: 'US FDA', small: 'Tech' },
]

// The four concerns East Delhi walks in with most often. Images are the site's
// own treatment photos, re-cropped to this page's 3:4 card by
// `npm run assets:consult` — the homepage's copies are sized for a much wider
// card and cost roughly twice the bytes here for no visible gain.
// The pane and its thumbnail share one file on purpose: the thumbnail is then
// free, because the browser already has it.
const CONCERNS = [
  {
    key: 'pigment', label: 'Pigmentation', img: '/assets/c-pigment.webp',
    title: 'Dark patches that creams keep missing',
    text: 'Melasma, tanning and post-acne marks look alike but need completely different treatment. The wrong one can set you back months.',
    facts: ['Q-switched laser', 'Medical peels', '4–6 sessions'],
  },
  {
    key: 'acne', label: 'Acne', img: '/assets/c-acne.webp',
    title: 'Breakouts that keep coming back',
    text: 'Hormonal, bacterial or product-triggered — the cause decides everything. Scarring is graded separately from active acne.',
    facts: ['Acne grading', 'Medical peels', 'Scar therapy'],
  },
  {
    key: 'hairfall', label: 'Hair fall', img: '/assets/c-hairfall.webp',
    title: 'It usually starts inside the body',
    text: 'Thyroid, iron and vitamin D show up on your scalp first. Tests come before any treatment plan here, never after.',
    facts: ['Scalp analysis', 'GFC / PRP', 'Blood work'],
  },
  {
    key: 'laser', label: 'Laser', img: '/assets/c-laser.webp',
    title: 'Settings depend on your skin type',
    text: 'Indian skin needs specific laser parameters to stay safe. Patch test first, an honest session count after.',
    facts: ['Soprano Titanium', 'Patch test', 'All skin types'],
  },
]

// Concern picker. `plan` is what the doctor actually does in the ₹99 sitting —
// it is the page's answer to "what do I get for ninety-nine rupees".
const PICKER = [
  {
    k: 'acne', ic: '🔴', t: 'Acne & marks', d: 'Pimples, dark spots, scars',
    who: 'For acne-prone skin',
    title: 'Acne is a medical condition, not bad luck.',
    text: 'The doctor checks whether it is hormonal, bacterial or product-triggered, and grades your scarring separately. That one distinction decides whether you need a peel, a laser, or simply the right medication.',
    plan: ['Skin analysis', 'Acne grading', 'Medical peels', 'Scar assessment'],
  },
  {
    k: 'pigment', ic: '🟤', t: 'Pigmentation', d: 'Melasma, tanning, dullness',
    who: 'For pigmentation & melasma',
    title: 'Dark patches need the cause found first.',
    text: 'Melasma, sun tanning and post-acne marks look similar but respond to completely different treatments. Using the wrong one can deepen pigmentation — which is why so many home remedies backfire.',
    plan: ['Pigment depth check', 'Q-switched laser', 'Peel suitability', 'Aftercare plan'],
  },
  {
    k: 'hairfall', ic: '💧', t: 'Hair fall', d: 'Thinning, patches, dandruff',
    who: 'For hair fall & thinning',
    title: 'Hair fall often starts inside the body.',
    text: 'Thyroid, iron, vitamin D and stress show up on your scalp before anywhere else. The doctor examines your scalp under magnification and orders tests where needed, before recommending anything at all.',
    plan: ['Scalp analysis', 'Blood test advice', 'GFC / PRP suitability', 'Density check'],
  },
  {
    k: 'laser', ic: '✨', t: 'Unwanted hair', d: 'Face, underarms, full body',
    who: 'For laser hair reduction',
    title: 'Your skin type decides the settings.',
    text: 'Indian skin needs specific laser parameters to be safe. The doctor patch-tests, tells you honestly how many sessions your hair type will realistically need, and quotes the full package cost before you start.',
    plan: ['Patch test', 'Soprano Titanium', 'Session estimate', 'Package cost'],
  },
  {
    k: 'aging', ic: '🕊️', t: 'Fine lines', d: 'Sagging, dull, tired skin',
    who: 'For early ageing',
    title: 'Prevention costs far less than correction.',
    text: 'Fine lines, sagging and dullness respond very differently at 28 than at 45. The doctor maps your skin’s elasticity, then recommends only what your age and skin actually need — often less than you expect.',
    plan: ['Elasticity check', 'HIFU suitability', 'Collagen plan', 'Homecare routine'],
  },
  {
    k: 'bridal', ic: '💍', t: 'Wedding glow', d: 'Event in 2–6 months',
    who: 'For brides & grooms',
    title: 'Good skin runs on a calendar.',
    text: 'Peels and lasers need gaps between sessions, and no treatment should happen in the last two weeks before the event. Tell us your date and you get a week-by-week schedule that works backwards from it.',
    plan: ['Timeline plan', 'Peels & hydra facials', 'Glow schedule', 'Pre-event rules'],
  },
]

const WHY = [
  { ic: '🔬', h: 'You get a diagnosis, not a guess', p: 'Acne has six common causes. Hair fall has ten. Treatment only works once the cause is right — that is the entire job of the consultation.' },
  { ic: '💰', h: 'You see the full cost upfront', p: 'Number of sessions, the gap between them, the total spend. Written down before you commit to a single rupee of treatment.' },
  { ic: '🤝', h: 'Saying no is completely fine', p: 'Take the plan home. Compare it anywhere you like. No package gets pushed on you in the room — that is a promise, not a policy.' },
  { ic: '📍', h: 'Minutes from Laxmi Nagar metro', p: 'Follow-ups are what make skin treatment work. Being close by in Preet Vihar is what makes people actually finish the course.' },
]

const SLOTS = ['Morning · 10–1', 'Afternoon · 1–4', 'Evening · 4–7', 'Weekend']

const FAQ = [
  { q: `Is ₹${CONSULT.price} the only thing I pay?`, a: `Yes, for the consultation. The doctor shares treatment costs after examining you, and you decide separately. Nothing is charged without you agreeing to it first — and the ₹${CONSULT.price} is adjusted into your first treatment if you go ahead.` },
  { q: 'Will you push me into a package?', a: 'No. You get a written plan and you are free to take it home and think. Plenty of people book the consultation, take the advice, and come back months later.' },
  { q: 'How much do treatments usually cost?', a: 'It depends entirely on the concern and how many sessions it needs. That is exactly why the consultation exists — so you leave with a real number instead of a guess.' },
  { q: 'Does laser or peel treatment hurt?', a: 'Most patients describe it as a warm snap. Our Soprano Titanium platform cools the skin as it works, numbing cream is used where needed, and you can go back to work the same day for most procedures.' },
  { q: 'How long before I see results?', a: 'Acne usually starts settling in 3–4 weeks. Pigmentation and hair fall take longer, generally 8–12 weeks. The doctor gives you a realistic timeline upfront rather than a hopeful one.' },
  { q: 'Can I reschedule my appointment?', a: `Yes, free of cost. Message us on WhatsApp and we will move it. Your ₹${CONSULT.price} stays valid.` },
  { q: 'Where exactly is the clinic?', a: `${CLINIC.address.line1}, ${CLINIC.address.line2}. Close to Nirman Vihar and Laxmi Nagar metro on the Blue Line, in ${CLINIC.address.area}.` },
]

// Rail cards are never wider than 230 CSS px, so these are the 460px-wide
// copies from `npm run assets:consult`, not the 960x1280 gallery originals.
const SHOTS = [
  { src: '/assets/c-shot-front.webp', cap: 'Our storefront on Shankar Vihar' },
  { src: '/assets/c-shot-lounge.webp', cap: 'Reception lounge, air-conditioned' },
  { src: '/assets/c-shot-consult.webp', cap: 'Consultation lounge & product counter' },
  { src: '/assets/c-shot-room.webp', cap: 'Treatment room with skin-analysis wall' },
  { src: '/assets/c-shot-machines.webp', cap: 'Our laser, HIFU & hydra machines' },
]

/* ---------------------------------------------------------------------------
   Small pieces
   ------------------------------------------------------------------------ */

const Tick = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#1b7a3e" opacity=".14" />
    <path d="M7.5 12.4l3.1 3.1 6-6.6" stroke="#1b7a3e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TickGold = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#e3a63b" opacity=".16" />
    <path d="M7.5 12.4l3.1 3.1 6-6.6" stroke="#f4c563" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const WaIcon = ({ size = 24, fill = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden="true">
    <path d="M12.04 2.02c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.16-1.35a9.9 9.9 0 004.88 1.28h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04a9.88 9.88 0 00-7.05-2.91zm0 18.16h-.01a8.26 8.26 0 01-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.24 8.24 0 01-1.26-4.39c0-4.56 3.71-8.28 8.28-8.28 2.21 0 4.29.86 5.85 2.43a8.22 8.22 0 012.42 5.86c0 4.57-3.71 8.24-8.29 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.24-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.73 2.64 4.19 3.7.58.26 1.04.41 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.28z" />
  </svg>
)

/** Draggable before/after — the site's real result pairs from data.js. */
function Compare({ before, after, label, alt, width, height }) {
  const frame = useRef(null)
  const [pos, setPos] = useState(50)
  const dragging = useRef(false)

  const set = useCallback((clientX) => {
    const r = frame.current?.getBoundingClientRect()
    if (!r) return
    setPos(Math.min(Math.max(((clientX - r.left) / r.width) * 100, 4), 96))
  }, [])

  useEffect(() => {
    const move = (e) => { if (dragging.current) set(e.touches ? e.touches[0].clientX : e.clientX) }
    const up = () => { dragging.current = false }
    window.addEventListener('mousemove', move)
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('mouseup', up)
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchend', up)
    }
  }, [set])

  const down = (e) => { dragging.current = true; set(e.touches ? e.touches[0].clientX : e.clientX) }

  return (
    <div>
      <div
        className="cba" ref={frame} style={{ '--pos': `${pos}%`, aspectRatio: `${width} / ${height}` }}
        onMouseDown={down} onTouchStart={down} onClick={(e) => set(e.clientX)}
      >
        <Img src={before} alt={`${alt}, before treatment`} width={width} height={height} loading="lazy" />
        <Img className="cba__after" src={after} alt={`${alt}, after treatment`} width={width} height={height} loading="lazy" />
        <div className="cba__handle"><span className="cba__knob" aria-hidden="true">⇄</span></div>
        <span className="cba__tag cba__tag--l">Before</span>
        <span className="cba__tag cba__tag--r">After</span>
      </div>
      <p className="cba__cap">{label}</p>
    </div>
  )
}

/** Wrapper that fades its section in on scroll. It starts at opacity 0 in CSS
 *  and the observer below turns it on — see useReveals for why that is safe. */
const Reveal = ({ children, className = '' }) => <div className={`crv ${className}`}>{children}</div>

/** One observer for every .crv on the page, unobserving each on first hit —
 *  these reveals never need to run twice.
 *
 *  The safety net matters more than the effect does. `.crv` starts at opacity 0,
 *  so anything the observer fails to report stays invisible; that costs nothing
 *  when JS is simply absent (this is an SPA — no JS, no page at all) but it
 *  would be severe if IntersectionObserver existed and then said nothing, which
 *  is what happens in prerender and some embedded webviews. So: if the observer
 *  has not reported a single entry after two seconds, reveal everything and
 *  give up on the animation. A page that appears without a fade beats two
 *  thirds of a page that never appears. */
function useReveals() {
  useEffect(() => {
    const els = document.querySelectorAll('.crv')
    const revealAll = () => els.forEach((el) => el.classList.add('is-in'))
    if (!els.length) return
    if (!('IntersectionObserver' in window)) { revealAll(); return }

    let reported = false
    const io = new IntersectionObserver((entries) => {
      reported = true
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target) }
      })
    }, { threshold: 0.12 })
    els.forEach((el) => io.observe(el))

    const bail = setTimeout(() => { if (!reported) revealAll() }, 2000)
    return () => { clearTimeout(bail); io.disconnect() }
  }, [])
}

/* ---------------------------------------------------------------------------
   Page
   ------------------------------------------------------------------------ */

export default function Consult() {
  const [concern, setConcern] = useState(0)          // explorer card index
  const [picked, setPicked] = useState(null)         // picker chip key
  const [meter, setMeter] = useState(0)
  const [errs, setErrs] = useState({})
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState('')
  const [done, setDone] = useState(null)             // { name, paymentId } once booked
  const [mapOn, setMapOn] = useState(false)          // Google's iframe is opt-in
  const formRef = useRef(null)
  const touchX = useRef(null)

  const waBook = waLink(`Hi ${CLINIC.name}, I want to book the ₹${CONSULT.price} consultation.`)

  // The title and the noindex are static in consult.html — this page has its
  // own HTML entry, so nothing about them needs JavaScript.

  useReveals()

  // Fill the scarcity meter after paint, so it animates rather than appearing full.
  useEffect(() => {
    const t = setTimeout(() => setMeter(100 - (CONSULT.slotsLeft / CONSULT.slotsTotal) * 100), 400)
    return () => clearTimeout(t)
  }, [])

  // The explorer and the form's <select> stay in sync in both directions: pick
  // a card up here and the form below is already answered.
  const stepConcern = (n) => setConcern((n + CONCERNS.length) % CONCERNS.length)

  const onSubmit = async (e) => {
    e.preventDefault()
    setFailed('')
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const phone = String(fd.get('phone') || '').trim()
    const concernKey = String(fd.get('concern') || '')
    const slot = String(fd.get('slot') || '')

    const next = {
      name: name.length < 2,
      phone: !/^[6-9]\d{9}$/.test(phone),
      concern: !concernKey,
      slot: !slot,
    }
    setErrs(next)
    if (Object.values(next).some(Boolean)) {
      formRef.current?.querySelector('.cfield.is-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const lead = {
      bookingId: bookingId(),
      name,
      phone: `+91${phone}`,
      concern: concernKey,
      slot,
      source: 'consult_lp',
      ...utm(),
    }

    // No payment configured yet — hand the lead to WhatsApp so the page still
    // books people rather than dead-ending.
    if (!CONSULT.appsScriptUrl || !CONSULT.razorpayKey) {
      window.location.href = waLink(
        `Hi ${CLINIC.name}, I'd like to book the ₹${CONSULT.price} consultation.\n` +
        `Name: ${name}\nPhone: +91${phone}\nConcern: ${concernKey}\nPreferred: ${slot}`
      )
      return
    }

    setBusy(true)
    // Fire the lead row and forget it. Deliberately NOT awaited: Apps Script
    // can take a couple of seconds to wake up, and making someone stare at a
    // spinner before the payment sheet appears is how bookings get abandoned.
    // If it fails, handlePaid writes the row from scratch instead.
    post({ action: 'lead', ...lead }).catch(() => {})

    try {
      // Only when the account demands an order — see CONSULT.useOrders.
      let order = null
      if (CONSULT.useOrders) {
        order = await post({ action: 'createOrder', ...lead })
        if (!order?.orderId) throw new Error(order?.error || 'Could not start the payment')
      }
      await loadScript(RZP_SCRIPT)
      openCheckout(order, lead, setDone, setBusy, setFailed)
    } catch (err) {
      setBusy(false)
      setFailed(`${err.message}. Please try again, or message us on WhatsApp.`)
    }
  }

  const active = CONCERNS[concern]
  const answer = picked ? PICKER.find((p) => p.k === picked) : null

  return (
    <>
      {/* ---------- UTILITY ---------- */}
      <div className="cutil">
        <a href={telLink}><span aria-hidden="true">☏</span> {CLINIC.phoneDisplay}</a>
        <a className="cwa-pill" href={waBook} target="_blank" rel="noopener noreferrer">
          <WaIcon size={12} fill="#4ade80" /> WhatsApp
        </a>
      </div>

      {/* ---------- HEADER ---------- */}
      <header className="chead">
        <a className="chead__logo" href="/" aria-label={`${CLINIC.name} home`}>
          <Img src="/assets/kotil-logo-light.webp" alt={CLINIC.name} width={354} height={128} eager />
        </a>
        <a className="cbtn-gold" href="#book">Book ₹{CONSULT.price}</a>
      </header>

      {/* ---------- HERO + THE PASS ---------- */}
      <div className="chero">
        <div className="cwrap">
          <span className="clocus"><i className="cdot" /> {CLINIC.address.area} · {hoursLine}</span>
          <h1>Your skin deserves a <em>diagnosis</em>, not another cream.</h1>
          <p className="clede">
            Sit down with our doctor, get your skin actually analysed, and walk out
            knowing exactly what to do next — and what it will cost.
          </p>

          <div className="cpass">
            <div className="cpass__top">
              <div className="cpass__label">Consultation pass</div>
              <div className="cprice-row">
                <div className="cprice">₹{CONSULT.price}</div>
                <div className="cwas">
                  <s>₹{CONSULT.strike}</s>
                  <b>You save ₹{CONSULT.strike - CONSULT.price}</b>
                </div>
              </div>
              <p className="cprice-for">Full consultation. No hidden charges.</p>
              <ul className="cincl">
                {INCLUDED.map((t) => <li key={t}><Tick /> {t}</li>)}
              </ul>
            </div>
            <div className="cpass__bot">
              <i className="cpass__notch cpass__notch--l" />
              <i className="cpass__notch cpass__notch--r" />
              <p className="cslots">
                <span>Slots left this week</span>
                <b>{CONSULT.slotsLeft} of {CONSULT.slotsTotal}</b>
              </p>
              <div className="cmeter"><i style={{ width: `${meter}%` }} /></div>
              <a className="cbtn-cta" href="#book">Book my ₹{CONSULT.price} slot →</a>
              <p className="cassure">🔒 Secure payment · Free reschedule · No sales pressure</p>
            </div>
          </div>

          <div className="ctrust">
            {TRUST.map((t) => <div key={t.small}><b>{t.big}</b><span>{t.small}</span></div>)}
          </div>
        </div>
      </div>

      {/* ---------- TREATMENT EXPLORER ---------- */}
      <section className="csec">
        <div className="cwrap">
          <p className="ckick">What we treat</p>
          <h2 className="ch2">Tap a card to <em>open it</em></h2>
          <p className="csub">Four things East Delhi walks in with most often. Each one has a different fix.</p>

          <div
            className="cstage"
            onClick={() => stepConcern(concern + 1)}
            onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              if (touchX.current === null) return
              const dx = e.changedTouches[0].clientX - touchX.current
              if (Math.abs(dx) > 45) stepConcern(concern + (dx < 0 ? 1 : -1))
              touchX.current = null
            }}
          >
            <div className="cbar" aria-hidden="true">
              {CONCERNS.map((c, i) => <i key={c.key} className={i === concern ? 'is-on' : undefined} />)}
            </div>

            {CONCERNS.map((c, i) => (
              <article
                key={c.key}
                className={`cpane${i === concern ? ' is-on' : ''}${i < concern ? ' cpane--prev' : ''}`}
                aria-hidden={i !== concern}
              >
                <Img src={c.img} alt={`${c.label} treatment at ${CLINIC.name}`} loading={i === 0 ? 'eager' : 'lazy'} />
                <div className="cpane__txt">
                  <span className="cmask cmask--1"><span className="cpane__k">{c.label}</span></span>
                  <span className="cmask cmask--2"><h3>{c.title}</h3></span>
                  <span className="cmask cmask--3"><p>{c.text}</p></span>
                  <div className="cfacts">{c.facts.map((f) => <span key={f}>{f}</span>)}</div>
                </div>
              </article>
            ))}

            <div className="cthumbs" role="tablist" aria-label="Treatments">
              {CONCERNS.map((c, i) => (
                <button
                  key={c.key} className="cthumb" role="tab" aria-selected={i === concern}
                  onClick={(e) => { e.stopPropagation(); setConcern(i) }}
                >
                  <Img src={c.img} alt="" loading="lazy" />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <a className="cxp-cta" href="#book">Book ₹{CONSULT.price} for this concern →</a>
        </div>
      </section>

      {/* ---------- CONCERN PICKER ---------- */}
      <section className="csec">
        <div className="cwrap">
          <p className="ckick">Start here</p>
          <h2 className="ch2">What is bothering you <em>right now?</em></h2>
          <p className="csub">Tap one. We&rsquo;ll show you exactly what the doctor looks at in your ₹{CONSULT.price} sitting.</p>

          <div className="cpicker">
            <div className="cchips" role="group" aria-label="Choose your main skin or hair concern">
              {PICKER.map((p) => (
                <button
                  key={p.k} className="cchip" aria-pressed={picked === p.k}
                  onClick={() => setPicked((cur) => (cur === p.k ? null : p.k))}
                >
                  <span className="cchip__ic" aria-hidden="true">{p.ic}</span>
                  <span className="cchip__t">{p.t}</span>
                  <span className="cchip__d">{p.d}</span>
                </button>
              ))}
            </div>

            {answer && (
              <div className="canswer" aria-live="polite">
                <p className="canswer__who">{answer.who}</p>
                <h3>{answer.title}</h3>
                <p>{answer.text}</p>
                <div className="cplan">{answer.plan.map((x) => <span key={x}>{x}</span>)}</div>
                <a className="cbtn-cta" href="#book">Book ₹{CONSULT.price} for this →</a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- WHY ---------- */}
      <section className="csec csec--cream2">
        <Reveal className="cwrap">
          <p className="ckick">Why ₹{CONSULT.price} is worth it</p>
          <h2 className="ch2">Most people waste <em>two years</em> guessing.</h2>
          <p className="csub">Random creams, YouTube remedies, salon facials. One honest diagnosis saves all of it.</p>
          <div className="ccards">
            {WHY.map((c) => (
              <div className="ccard" key={c.h}>
                <span className="ccard__ic" aria-hidden="true">{c.ic}</span>
                <div><h4>{c.h}</h4><p>{c.p}</p></div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------- RESULTS ---------- */}
      <section className="csec">
        <Reveal className="cwrap">
          <p className="ckick">Real patients</p>
          <h2 className="ch2">Drag to see the <em>difference</em></h2>
          <p className="csub">Actual outcomes from treatments carried out at our {CLINIC.address.area} clinic, shared with consent.</p>
          {COMPARISONS.map((c) => <Compare key={c.id} {...c} />)}
          <p className="cnote">Individual results vary with skin type, the concern treated and how consistently the plan is followed.</p>
        </Reveal>
      </section>

      {/* ---------- DOCTOR-LED ---------- */}
      <section className="csec csec--cream2">
        <Reveal className="cwrap">
          <p className="ckick">Who you&rsquo;ll sit with</p>
          <h2 className="ch2">A doctor sees you. <em>Every time.</em></h2>
          <p className="csub">Not a counsellor, not a trainee. Your consultation and your procedure are both doctor-led.</p>
          <div className="cdoc">
            <div className="cdoc__photo">
              <Img src="/assets/c-doctor.webp" alt={`Consultation lounge at ${CLINIC.name}`} width={800} height={600} loading="lazy" />
            </div>
            <div className="cdoc__body">
              <p className="cdoc__role">Doctor-led care · 15+ years</p>
              <h3>Diagnosis before products. Always.</h3>
              <blockquote>
                Half the people who walk in here don&rsquo;t need a big package. They need
                the right thing, done properly, for a few weeks. We would rather tell you
                that than sell you something.
              </blockquote>
              <ul className="cdoc__pts">
                <li><TickGold /> Every plan starts with a one-on-one skin and scalp analysis</li>
                <li><TickGold /> US FDA-approved platforms — Soprano Titanium, Pico, HIFU</li>
                <li><TickGold /> {REVIEW_RATING.score}★ from {REVIEW_RATING.count} Google reviews</li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- INSIDE THE CLINIC ---------- */}
      <section className="csec">
        <Reveal className="cwrap">
          <p className="ckick">Inside the clinic</p>
          <h2 className="ch2">This is where you&rsquo;ll <em>actually sit</em></h2>
          <p className="csub">Shankar Vihar main road, {CLINIC.address.area}. Real photos, not stock.</p>
        </Reveal>
        <div className="cwrap">
          <div className="crail">
            {SHOTS.map((s) => (
              <figure className="cshot" key={s.src}>
                <Img src={s.src} alt={s.cap} loading="lazy" />
                <b>{s.cap}</b>
              </figure>
            ))}
          </div>
          <p className="crailhint">← Swipe to see more →</p>
        </div>
      </section>

      {/* ---------- REVIEWS ---------- */}
      <section className="csec">
        <Reveal className="cwrap">
          <p className="ckick">{REVIEW_RATING.score} ★ on Google</p>
          <h2 className="ch2">What East Delhi <em>says</em></h2>
          <p className="crate">
            <strong>{REVIEW_RATING.score}</strong>
            <span className="cstars" aria-hidden="true">★★★★★</span>
            <span>Based on {REVIEW_RATING.count} Google reviews</span>
          </p>
        </Reveal>
        <div className="cwrap">
          <div className="crail">
            {REVIEWS.map((r) => (
              <div className="crev" key={r.name}>
                <div className="cstars" aria-label={`${r.stars} out of 5`}>{'★'.repeat(r.stars)}</div>
                <p>{r.text}</p>
                <div className="crev__by">
                  <span className="crev__av" aria-hidden="true">{r.name[0]}</span>
                  <div><b>{r.name}</b><span>{r.when} · Google</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- BOOK ---------- */}
      <section className="csec cform-sec" id="book">
        <div className="cwrap">
          <p className="ckick">Book your slot</p>
          <h2 className="ch2">Two minutes. <em>Then you&rsquo;re in.</em></h2>
          <p className="csub">
            Pay ₹{CONSULT.price} online to lock the slot. You&rsquo;ll be taken straight to
            WhatsApp with your payment ID, and our team confirms the timing from there.
          </p>

          <div className="cfbox">
            {done ? (
              <div className="cdone">
                <div className="cdone__tick" aria-hidden="true">✓</div>
                <h3>Slot held for you</h3>
                <p>
                  Thanks {done.name.split(' ')[0]} — taking you to WhatsApp to confirm
                  your timing. Tap below if it doesn&rsquo;t open on its own.
                </p>
                {/* Shown, not just sent: if WhatsApp fails to open, this is the
                    number the visitor can read out on a phone call. */}
                {done.paymentId && <code>Payment ID: {done.paymentId}</code>}
                <a
                  className="cbtn-cta cbtn-wa"
                  href={waLink(
                    `Hi ${CLINIC.name}, I've paid ₹${CONSULT.price} for my consultation.\n` +
                    (done.paymentId ? `Payment ID: ${done.paymentId}\n` : '') +
                    (done.bookingId ? `Booking ID: ${done.bookingId}\n` : '') +
                    `Name: ${done.name}`
                  )}
                  target="_blank" rel="noopener noreferrer"
                >
                  <WaIcon size={19} fill="#04310f" /> Message us on WhatsApp
                </a>
              </div>
            ) : (
              <form ref={formRef} onSubmit={onSubmit} noValidate>
                <div className={`cfield${errs.name ? ' is-err' : ''}`}>
                  <label htmlFor="c-name">Your name</label>
                  <input id="c-name" name="name" type="text" placeholder="Full name" autoComplete="name" />
                  <p className="cfield__msg">Please enter your name</p>
                </div>

                <div className={`cfield${errs.phone ? ' is-err' : ''}`}>
                  <label htmlFor="c-phone">WhatsApp number</label>
                  <div className="cphone">
                    <span className="cphone__cc" aria-hidden="true">+91</span>
                    <input
                      id="c-phone" name="phone" type="tel" placeholder="98765 43210"
                      inputMode="numeric" maxLength={10} autoComplete="tel-national"
                      onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10) }}
                    />
                  </div>
                  <p className="cfield__msg">Enter a valid 10-digit mobile number</p>
                </div>

                <div className={`cfield${errs.concern ? ' is-err' : ''}`}>
                  <label htmlFor="c-concern">Main concern</label>
                  {/* defaults to whatever they last tapped in the explorer or the picker */}
                  <select id="c-concern" name="concern" defaultValue={picked || active.key} key={picked || active.key}>
                    <option value="">Select your concern</option>
                    {PICKER.map((p) => <option key={p.k} value={p.k}>{p.t}</option>)}
                    <option value="other">Something else</option>
                  </select>
                  <p className="cfield__msg">Please choose one</p>
                </div>

                <div className={`cfield${errs.slot ? ' is-err' : ''}`}>
                  <label>Preferred time</label>
                  <div className="cslotgrid">
                    {SLOTS.map((s, i) => (
                      <span key={s}>
                        <input type="radio" name="slot" id={`c-slot-${i}`} value={s} />
                        <label htmlFor={`c-slot-${i}`}>{s}</label>
                      </span>
                    ))}
                  </div>
                  <p className="cfield__msg">Pick a time that suits you</p>
                </div>

                <button type="submit" className="cbtn-cta" disabled={busy}>
                  {busy ? 'Opening secure payment…' : `Pay ₹${CONSULT.price} & confirm slot`}
                </button>
                {failed && <p className="cformerr">{failed}</p>}
                <p className="cfnote">
                  By continuing you agree to be contacted on WhatsApp about your appointment.
                  ₹{CONSULT.price} is adjusted into your first treatment.
                </p>
                <p className="cpaylogos">🔒 UPI · CARDS · NETBANKING</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="csec">
        <Reveal className="cwrap">
          <p className="ckick">Before you book</p>
          <h2 className="ch2">Honest <em>answers</em></h2>
          <div className="cfaq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <div className="cfaq__a">{f.a}</div>
              </details>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------- LOCATION ---------- */}
      <section className="csec csec--cream2">
        <Reveal className="cwrap">
          <p className="ckick">Find us</p>
          <h2 className="ch2">Right here in <em>{CLINIC.address.area.split(',')[0]}</em></h2>
          <div className="cloc">
            <div className="cloc__row">
              <span className="cloc__ic" aria-hidden="true">📍</span>
              <div><b>{CLINIC.name}</b><span>{CLINIC.address.line1}, {CLINIC.address.line2}</span></div>
            </div>
            <div className="cloc__row">
              <span className="cloc__ic" aria-hidden="true">🕐</span>
              <div><b>Clinic timings</b><span>{hoursLine}</span></div>
            </div>
            <div className="cloc__row">
              <span className="cloc__ic" aria-hidden="true">🚇</span>
              <div><b>Nearest metro</b><span>Nirman Vihar &amp; Laxmi Nagar · Blue Line</span></div>
            </div>
            <div className="cloc__row">
              <span className="cloc__ic" aria-hidden="true">☏</span>
              <div><b>Call or WhatsApp</b><span><a href={telLink} style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>{CLINIC.phoneDisplay}</a></span></div>
            </div>
            {/* Google's embed is roughly a megabyte of tiles and script, and it
                sits at the very bottom of a page whose job is the booking form
                above it. loading="lazy" still fetches the whole thing for
                anyone who scrolls this far, so it is opt-in instead: the
                address and "Get directions" are already here, and the map only
                loads for someone who actually asks to see it. */}
            <div className="cmapbox">
              {mapOn ? (
                <iframe src={mapEmbedSrc} title={`${CLINIC.name} location`} referrerPolicy="no-referrer-when-downgrade" />
              ) : (
                <button className="cmapbox__ask" onClick={() => setMapOn(true)}>
                  <span className="cmapbox__pin" aria-hidden="true">📍</span>
                  <b>Show the map</b>
                  <span>Loads Google Maps</span>
                </button>
              )}
            </div>
            <a className="cdirbtn" href={directionsLink} target="_blank" rel="noopener noreferrer">📍 Get directions</a>
          </div>
        </Reveal>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="cfoot">
        <div className="cwrap">
          <Img src="/assets/kotil-logo-light.webp" alt={CLINIC.name} width={354} height={128} loading="lazy" />
          <div className="cfoot__links">
            <a href={telLink}>Call</a>
            <a href={waBook} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="#book">Book ₹{CONSULT.price}</a>
            <a href="/">Full site</a>
          </div>
          <p>{CLINIC.address.line1}, {CLINIC.address.line2}</p>
          <p style={{ marginTop: 10, opacity: .6 }}>
            Results differ between individuals. Treatment suitability is decided by the
            doctor after examination. © {new Date().getFullYear()} {CLINIC.name}.
          </p>
        </div>
      </footer>

      {/* ---------- STICKY DOCK ---------- */}
      <div className="cdock">
        <div className="cdock__pr"><b>₹{CONSULT.price}</b><s>₹{CONSULT.strike}</s></div>
        <a className="cbtn-gold" href="#book">Book my slot</a>
        <a className="cdock__wa" href={enquireLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp us">
          <WaIcon />
        </a>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------------------
   Payment plumbing
   ------------------------------------------------------------------------ */

/** POST to the Apps Script web app.
 *  text/plain is deliberate: Apps Script cannot answer a CORS preflight, and
 *  application/json triggers one. The script reads e.postData.contents either
 *  way, so this is the standard way to talk to it from a browser. */
async function post(body) {
  const res = await fetch(CONSULT.appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Booking server returned ${res.status}`)
  return res.json()
}

/** Load Razorpay's checkout.js on demand — never on page load. */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = () => reject(new Error('Payment could not load'))
    document.head.appendChild(s)
  })
}

/** KS-<ddmm>-<4 chars>. Ties the pre-payment lead row to the payment that
 *  follows it, and it is short enough to read out over the phone. */
function bookingId() {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0')
  return `KS-${dd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

/** Whatever the ad platform appended to the URL, so the sheet can show which
 *  campaign a booking came from. */
function utm() {
  const q = new URLSearchParams(window.location.search)
  return { utm_source: q.get('utm_source') || '', utm_campaign: q.get('utm_campaign') || '' }
}

function openCheckout(order, lead, setDone, setBusy, setFailed) {
  const rzp = new window.Razorpay({
    key: CONSULT.razorpayKey,
    // Only present when CONSULT.useOrders is on. Razorpay accepts a bare
    // amount otherwise, which is what keeps the payment sheet instant.
    ...(order ? { order_id: order.orderId, amount: order.amount, currency: order.currency || 'INR' }
              : { amount: CONSULT.price * 100, currency: 'INR' }),
    name: CLINIC.name,
    description: `₹${CONSULT.price} consultation`,
    image: '/apple-touch-icon.png',
    prefill: { name: lead.name, contact: lead.phone },
    notes: { bookingId: lead.bookingId, concern: lead.concern, slot: lead.slot },
    theme: { color: '#e3a63b' },
    modal: {
      // Not a failure — they can just press the button again. The lead row is
      // already in the sheet as "Started (not paid)" either way.
      ondismiss: () => { setBusy(false); setFailed('Payment cancelled. Your slot is not held yet.') },
    },
    handler: (r) => {
      setBusy(false)
      setDone({ name: lead.name, paymentId: r.razorpay_payment_id, bookingId: lead.bookingId })
      // Mark the row paid, then hand the visitor to WhatsApp with the same id.
      // Not awaited and errors swallowed on purpose: the money has already
      // moved, so nothing here may block or scare the person who just paid.
      // The payment id travels in the WhatsApp message regardless, so even a
      // total backend failure leaves the counsellor something to search for.
      post({ action: 'paid', paymentId: r.razorpay_payment_id, ...lead }).catch(() => {})
      const msg =
        `Hi ${CLINIC.name}, I've paid ₹${CONSULT.price} for my consultation.\n` +
        `Payment ID: ${r.razorpay_payment_id}\nBooking ID: ${lead.bookingId}\n` +
        `Name: ${lead.name}\nConcern: ${lead.concern}\nPreferred: ${lead.slot}`
      setTimeout(() => { window.location.href = waLink(msg) }, 1500)
    },
  })
  rzp.on('payment.failed', (resp) => {
    setBusy(false)
    setFailed(resp?.error?.description || 'That payment did not go through. Please try again.')
  })
  rzp.open()
}
