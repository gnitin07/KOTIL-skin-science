import { useState, useRef, useEffect, useCallback } from 'react'
import { CLINIC, waLink, hoursLine } from '../config.js'

/**
 * "Kotil Assist" — a guided, scripted assistant (no backend: this is a static
 * site, so the "AI" is a curated decision tree + keyword matching over the
 * clinic's real treatment knowledge).
 *
 * Flow: pick a concern (or type one) -> get the matching treatment, sessions,
 * safety and offer answers -> every path funnels to "book on WhatsApp".
 * The handoff link carries the WHOLE conversation context (concern + topics
 * asked) prefilled, so the team knows exactly what the visitor wants.
 */

// ---- knowledge base ------------------------------------------------------
const CONCERNS = [
  {
    id: 'hair-loss', label: 'Hair fall / thinning',
    keywords: ['hair fall', 'hairfall', 'hair loss', 'thinning', 'bald', 'gfc', 'prp', 'regrow'],
    treatment: 'GFC / PRP Hair Regrowth',
    reply: 'For hair fall we do doctor-led GFC & PRP therapy — growth factors from your own blood that strengthen weak roots and revive growth. Currently 20% off.',
    sessions: 'Most patients take 4–6 sessions, spaced about a month apart. Visible reduction in hair fall usually starts by session 2–3.',
    safety: 'Completely doctor-led and uses your own growth factors, so reactions are rare. Minimal downtime — you can go back to work the same day.',
  },
  {
    id: 'unwanted-hair', label: 'Unwanted hair',
    keywords: ['unwanted hair', 'hair removal', 'laser hair', 'lhr', 'waxing', 'shaving', 'underarm', 'bikini', 'full body'],
    treatment: 'Laser Hair Reduction (Soprano Titanium)',
    reply: 'Our Soprano Titanium (Alma, Israel) gives 80–90% average hair reduction — virtually painless, safe for all Indian skin types, with flat 30% off right now.',
    sessions: 'Typically 6–8 sessions for long-lasting results, each just 20–40 minutes depending on the area.',
    safety: 'US FDA approved and CE certified — the gold standard in laser hair reduction. ICE Plus cooling keeps it near-painless.',
  },
  {
    id: 'pigmentation', label: 'Pigmentation / dark spots',
    keywords: ['pigment', 'dark spot', 'melasma', 'freckle', 'tan', 'uneven tone', 'blemish', 'tattoo'],
    treatment: 'Pico / Q-Switch Laser + medicated peels',
    reply: 'Our Diode Pico laser breaks pigment into tiny particles without damaging surrounding skin — great for melasma, dark spots, even tattoo removal. Up to 25% off.',
    sessions: 'Usually 4–6 sessions depending on depth of pigmentation; your doctor will map it in the first consultation.',
    safety: 'Pico technology is specifically safe for Indian skin — minimal downtime, maximum results.',
  },
  {
    id: 'acne', label: 'Acne / scars',
    keywords: ['acne', 'pimple', 'scar', 'breakout', 'open pores', 'microneedling'],
    treatment: 'Acne treatment, scar removal & microneedling',
    reply: 'We treat active acne and the scars it leaves — personalised protocols with peels, microneedling and laser scar correction. 20% off currently.',
    sessions: 'Active acne shows improvement in 2–4 sittings; scar correction usually takes 3–6 sessions.',
    safety: 'Everything starts with a doctor consultation, so the plan matches your skin — no generic one-size protocols.',
  },
  {
    id: 'glow', label: 'Dull skin / glow',
    keywords: ['glow', 'dull', 'facial', 'hydra', 'brighten', 'fresh', 'radiance'],
    treatment: '17-in-1 Hydra Facial',
    reply: 'Our 17-in-1 Hydra Facial combines hydro-dermabrasion, RF, ultrasound, LED and oxygen infusion — instantly glowing, hydrated skin in one sitting. 20% off.',
    sessions: 'You see the glow after a single session; monthly sittings keep it going.',
    safety: 'Non-invasive and suits all skin types — it is our most relaxing treatment.',
  },
  {
    id: 'aging', label: 'Sagging / anti-ageing',
    keywords: ['sag', 'aging', 'ageing', 'wrinkle', 'fine line', 'tighten', 'lift', 'hifu', 'jawline'],
    treatment: 'HIFU Skin Tightening & Facial Lift',
    reply: 'HIFU sends focused ultrasound into the SMAS layer — the same layer surgeons target — lifting and tightening without surgery. Flat 30% off.',
    sessions: 'Most people need just 1–2 sessions a year; results build over 2–3 months as collagen rebuilds.',
    safety: 'Non-invasive, no downtime, no surgery — clinically proven and painless.',
  },
  {
    id: 'body', label: 'Body shaping',
    keywords: ['body', 'fat', 'inch loss', 'contour', 'shape', 'slim', 'stretch mark'],
    treatment: 'HIFU Body Contouring',
    reply: 'HIFU body contouring targets stubborn fat pockets and tightens skin — visible inch loss possible in a single session. We also treat stretch marks.',
    sessions: 'Depends on the area — many see measurable inch loss from the very first session.',
    safety: 'Non-invasive with no downtime; you can resume your day immediately.',
  },
]

const GENERIC = {
  price: `Exact pricing depends on the area and plan, so the doctor confirms it at consultation — but current offers run 20–30% off across treatments. WhatsApp us and the team shares the price list immediately.`,
  timing: `We're ${hoursLine.toLowerCase()}. Walk-ins are welcome but sessions run by prior appointment, at ${CLINIC.address.line1}, ${CLINIC.address.line2}.`,
  fallbackNudge: `I want you to get an exact answer for that — the fastest way is a quick word with our team. Shall I book you an appointment on WhatsApp?`,
}

const KEYWORD_TOPICS = [
  { topic: 'price', words: ['price', 'cost', 'charge', 'fee', 'offer', 'discount', 'kitna', 'rate'] },
  { topic: 'timing', words: ['time', 'timing', 'open', 'close', 'hour', 'sunday', 'tuesday', 'address', 'location', 'where', 'reach'] },
]

const CONCERN_CHIPS = CONCERNS.map((c) => ({ label: c.label, action: `concern:${c.id}` }))
const START_CHIPS = [...CONCERN_CHIPS, { label: 'Browse all treatments', action: 'nav:treatments' }]
const FOLLOWUP_CHIPS = [
  { label: 'Book an appointment', action: 'book' },
  { label: 'How many sessions?', action: 'topic:sessions' },
  { label: 'Is it safe?', action: 'topic:safety' },
  { label: 'Price & offers', action: 'topic:price' },
  { label: 'Another concern', action: 'restart' },
]

const AiIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l1.9 5.7L19.6 9l-5.7 1.9L12 16.6l-1.9-5.7L4.4 9l5.7-1.3L12 2zm7 11l.95 2.85L22.8 17l-2.85.95L19 20.8l-.95-2.85L15.2 17l2.85-1.15L19 13z" />
  </svg>
)

export default function Assistant() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([])          // {from:'bot'|'user', text, chips?}
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const concernRef = useRef(null)               // active concern object
  const topicsRef = useRef(new Set())           // topics the visitor asked about
  const listRef = useRef(null)
  const timers = useRef([])

  const push = (m) => setMsgs((prev) => [...prev, m])

  /** Bot replies arrive after a short "typing" beat so the flow reads human. */
  const bot = useCallback((text, chips) => {
    setTyping(true)
    const t = setTimeout(() => {
      setTyping(false)
      push({ from: 'bot', text, chips })
    }, 500)
    timers.current.push(t)
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // keep the newest message in view
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, typing, open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const greet = useCallback(() => {
    push({ from: 'bot', text: `Hi! I'm Kotil Assist 👋 I can explain our treatments, sessions and offers — and book you in.\n\nChoose a concern, or type yours below:`, chips: START_CHIPS })
  }, [])

  const openPanel = () => {
    setOpen(true)
    if (msgs.length === 0) greet()
  }

  /** WhatsApp handoff carrying the whole conversation context. */
  const waHandoff = () => {
    const lines = [`Hi ${CLINIC.name}! I was chatting with your website assistant.`]
    if (concernRef.current) lines.push(`My concern: ${concernRef.current.label} (${concernRef.current.treatment}).`)
    const topics = [...topicsRef.current]
    if (topics.length) lines.push(`I asked about: ${topics.join(', ')}.`)
    lines.push(`I'd like to book an appointment. Please share the available slots and pricing.`)
    return waLink(lines.join('\n'))
  }

  const offerBook = () => {
    bot(
      `Perfect — I've written up everything we discussed so you don't have to repeat yourself. The team replies within minutes and will confirm your slot.`,
      [{ label: '✆ Continue on WhatsApp', action: 'wa' }, { label: 'Another concern', action: 'restart' }],
    )
  }

  const act = (action, label) => {
    if (action === 'wa') { window.open(waHandoff(), '_blank', 'noopener'); return }
    push({ from: 'user', text: label })

    if (action.startsWith('concern:')) {
      const c = CONCERNS.find((x) => x.id === action.slice(8))
      concernRef.current = c
      bot(`${c.reply}\n\nRecommended: ${c.treatment}.`, FOLLOWUP_CHIPS)
    } else if (action === 'topic:sessions') {
      topicsRef.current.add('sessions')
      bot(concernRef.current?.sessions ?? 'Session counts depend on the treatment — the doctor confirms a plan at consultation.', FOLLOWUP_CHIPS)
    } else if (action === 'topic:safety') {
      topicsRef.current.add('safety')
      bot(concernRef.current?.safety ?? 'Every treatment here is doctor-led on US-FDA/CE-certified machines.', FOLLOWUP_CHIPS)
    } else if (action === 'topic:price') {
      topicsRef.current.add('pricing')
      bot(GENERIC.price, FOLLOWUP_CHIPS)
    } else if (action === 'book') {
      offerBook()
    } else if (action === 'restart') {
      concernRef.current = null
      bot('Of course — what else can I help with?', START_CHIPS)
    } else if (action === 'nav:treatments') {
      setOpen(false)
      document.querySelector('#treatments')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  /** Free-text: match concerns first, then price/timing keywords, else nudge to book. */
  const submit = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    push({ from: 'user', text })
    const low = text.toLowerCase()

    const concern = CONCERNS.find((c) => c.keywords.some((k) => low.includes(k)))
    if (concern) {
      concernRef.current = concern
      bot(`${concern.reply}\n\nRecommended: ${concern.treatment}.`, FOLLOWUP_CHIPS)
      return
    }
    const hit = KEYWORD_TOPICS.find((t) => t.words.some((w) => low.includes(w)))
    if (hit) {
      topicsRef.current.add(hit.topic === 'price' ? 'pricing' : 'visit timings')
      bot(GENERIC[hit.topic], FOLLOWUP_CHIPS)
      return
    }
    topicsRef.current.add(`"${text.slice(0, 60)}"`)
    bot(GENERIC.fallbackNudge, [
      { label: '✆ Yes, book on WhatsApp', action: 'wa' },
      { label: 'Choose a concern', action: 'restart' },
    ])
  }

  return (
    <>
      {!open && (
        <button className="ai__pill" onClick={openPanel} aria-label="Open Kotil Assist">
          <span className="ai__pill-ico"><AiIcon /></span>
          Need help? <b>Ask Kotil Assist</b>
        </button>
      )}

      {open && (
        <div className="ai__panel" role="dialog" aria-label="Kotil Assist chat">
          <header className="ai__head">
            <span className="ai__head-ico"><AiIcon size={17} /></span>
            <div className="ai__head-txt">
              <strong>Kotil Assist</strong>
              <span>Replies instantly · books via WhatsApp</span>
            </div>
            <button className="ai__close" aria-label="Close assistant" onClick={() => setOpen(false)}>×</button>
          </header>

          <div className="ai__msgs" ref={listRef} data-lenis-prevent>
            {msgs.map((m, i) => (
              <div key={i} className={`ai__msg ai__msg--${m.from}`}>
                <p>{m.text}</p>
                {m.chips && i === msgs.length - 1 && !typing && (
                  <div className="ai__chips">
                    {m.chips.map((c) => (
                      <button key={c.action + c.label} className={`ai__chip${c.action === 'wa' ? ' ai__chip--wa' : ''}`}
                        onClick={() => act(c.action, c.label)}>{c.label}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {typing && <div className="ai__msg ai__msg--bot"><span className="ai__dots"><i /><i /><i /></span></div>}
          </div>

          <form className="ai__inputrow" onSubmit={submit}>
            <input
              className="ai__input" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me your concern…" aria-label="Tell me your concern"
            />
            <button className="ai__send" type="submit" aria-label="Send">➤</button>
          </form>
        </div>
      )}
    </>
  )
}
