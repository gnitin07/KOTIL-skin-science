import { bookLink } from './config.js'

// Machines used at the clinic. Each shot is a treatment IN PROGRESS — expert,
// patient and device together — not a vendor-style photo of the device alone.
export const MACHINES = [
  {
    id: 'hifu',
    name: 'HIFU Lift',
    tag: 'Skin Tightening',
    desc: 'Focused ultrasound that lifts and tightens sagging skin and jawline. No surgery, no downtime.',
    img: '/assets/m1.webp',
  },
  {
    id: 'diode',
    name: 'Diode Laser',
    tag: 'Hair Reduction',
    desc: 'Triple-wavelength diode platform for near-painless, long-lasting hair reduction on every skin type.',
    img: '/assets/m2.webp',
  },
  {
    id: 'qswitch',
    name: 'Q-Switch Laser',
    tag: 'Pigment & Tattoo',
    desc: 'Precision Q-switched energy that shatters pigment, melasma and dark spots without harming skin.',
    img: '/assets/m3.webp',
  },
  {
    id: 'led',
    name: 'LED Therapy',
    tag: 'Glow & Repair',
    desc: 'Medical-grade LED light that calms acne, speeds healing and rebuilds a natural, healthy glow.',
    img: '/assets/m4.webp',
  },
]

export const TREATMENTS = [
  { title: 'GFC Hair Regrowth', desc: 'Hair fall won’t stop? Doctor-led PRP to revive growth.', off: '20% Off', img: '/assets/t1.webp' },
  { title: 'Q-Switched Laser', desc: 'Stubborn dark spots? Clearer, even-toned skin.', off: '20% Off', img: '/assets/t2.webp' },
  { title: 'Laser Hair Reduction', desc: 'Tired of waxing? Painless, long-lasting smoothness.', off: '30% Off', img: '/assets/t3.webp' },
  { title: 'HIFU Skin Tightening', desc: 'Sagging & fine lines? Lift without surgery.', off: '30% Off', img: '/assets/t4.webp' },
  { title: 'Pigmentation Care', desc: 'Melasma & dark patches? Expert protocols that work.', off: '25% Off', img: '/assets/t5.webp' },
]

// Full treatment menu, transcribed from the clinic's live services pages
// (screenshots in raw-assets/services). Shown in the "See more" panel.
export const ALL_TREATMENTS = [
  { group: 'Laser Hair Reduction', items: [
    { name: 'Full Body LHR', desc: 'Advanced full body laser hair reduction for long-lasting smooth and clean skin.', off: '30% Off', img: '/services/full-body-lhr.webp' },
    { name: 'Face LHR', desc: 'Laser hair reduction for facial hair with expert care and skin-focused safety.', off: '30% Off', img: '/services/face-lhr.webp' },
    { name: 'Underarm LHR', desc: 'Underarm laser hair reduction for smoother skin and reduced shaving routine.', off: '30% Off', img: '/services/underarm-lhr.webp' },
    { name: 'Bikini LHR', desc: 'Professional bikini laser hair reduction treatment with privacy and clinical care.', off: '30% Off', img: '/services/bikini-lhr.webp' },
    { name: 'Full Hand with Full Legs LHR', desc: 'Laser hair reduction package for full hands and full legs with expert protocol.', off: '30% Off', img: '/services/full-hand-full-legs-lhr.webp' },
    { name: 'Full Hand with Underarms LHR', desc: 'Laser hair reduction package for full hands and underarms for smoother skin.', off: '30% Off', img: '/services/full-hand-underarms-lhr.webp' },
    { name: 'Back and Chest LHR', desc: 'Back and chest laser hair reduction treatment for cleaner and low-maintenance skin.', off: '30% Off', img: '/services/back-chest-lhr.webp' },
  ]},
  { group: 'Hair Treatment', items: [
    { name: 'PRP', desc: 'Doctor-led PRP treatment designed to support hair growth, weak roots and hair fall concerns.', off: '20% Off', img: '/services/prp.webp' },
    { name: 'Booster PRP', desc: 'Advanced PRP booster therapy for stronger roots, better scalp support and improved hair health.', off: '20% Off', img: '/services/booster-prp.webp' },
    { name: 'GFC', desc: 'Growth factor treatment for hair fall, thinning and weak hair roots under expert care.', off: '20% Off', img: '/services/gfc.webp' },
    { name: 'Meso Therapy', desc: 'Supportive therapy planned after consultation for targeted skin and hair improvement.', off: '20% Off', img: '/services/meso-therapy.webp' },
  ]},
  { group: 'Laser & Pigmentation', items: [
    { name: 'Laser Toning', desc: 'Advanced laser toning for pigmentation, uneven skin tone, dullness and visible dark spots.', off: '20% Off', img: '/services/laser-toning.webp' },
    { name: 'Carbon Laser', desc: 'Deep cleansing laser treatment for oily skin, clogged pores, tanning and dull skin appearance.', off: '20% Off', img: '/services/carbon-laser.webp' },
    { name: 'Freckles', desc: 'Targeted treatment for freckles, visible spots and uneven pigmentation concerns.', off: '20% Off', img: '/services/freckles.webp' },
    { name: 'Yellow Peel', desc: 'Professional peel treatment for pigmentation, uneven tone, dullness and smoother skin texture.', off: '20% Off', img: '/services/yellow-peel.webp' },
  ]},
  { group: 'Skin Concerns', items: [
    { name: 'Acne Treatment', desc: 'Personalized acne treatment for active acne, breakouts, marks and skin inflammation.', off: '20% Off', img: '/services/acne-treatment.webp' },
    { name: 'Scar Removal', desc: 'Targeted scar correction treatment for acne scars, marks and uneven skin texture.', off: '20% Off', img: '/services/scar-removal.webp' },
    { name: 'Microneedling', desc: 'Improve skin texture, acne scars, open pores and dullness with professional microneedling care.', off: '20% Off', img: '/services/microneedling.webp' },
    { name: 'Wart / Mole Removal', desc: 'Safe wart and mole removal procedure with proper consultation and clinical care.', off: '20% Off', img: '/services/wart-mole-removal.webp' },
  ]},
  { group: 'Hydra Facials', items: [
    { name: 'Basic Hydra', desc: 'Hydrating facial treatment for deep cleansing, freshness and improved skin glow.', off: '20% Off', img: '/services/basic-hydra.webp' },
    { name: 'Adv. Hydra', desc: 'Advanced hydra treatment for hydration, cleansing, clogged pores and dull skin.', off: '20% Off', img: '/services/adv-hydra.webp' },
    { name: 'Pro Hydra', desc: 'Premium hydra facial for intense hydration, smooth texture and refined skin glow.', off: '20% Off', img: '/services/pro-hydra.webp' },
    { name: 'Aqua Infusion', desc: 'Hydration-focused treatment for dry, dull and tired-looking skin.', off: '20% Off', img: '/services/aqua-infusion.webp' },
  ]},
  { group: 'Premium Facials', items: [
    { name: 'Ultra Clarity Facial', desc: 'Facial treatment for clearer, cleaner and refreshed skin with premium clinic care.', off: '20% Off', img: '/services/ultra-clarity-facial.webp' },
    { name: 'Biluminous Facial', desc: 'Glow-focused facial treatment for bright, fresh and luminous-looking skin.', off: '20% Off', img: '/services/biluminous-facial.webp' },
    { name: 'Glass Glow Facial', desc: 'Premium glow facial for smooth, hydrated and glass-skin inspired radiance.', off: '20% Off', img: '/services/glass-glow-facial.webp' },
    { name: 'Ultra Revive Facial', desc: 'Reviving facial treatment for dullness, tired skin and lost freshness.', off: '20% Off', img: '/services/ultra-revive-facial.webp' },
    { name: 'Ultra Luminous Facial', desc: 'Luxury facial treatment designed for luminous, hydrated and smooth skin.', off: '20% Off', img: '/services/ultra-luminous-facial.webp' },
    { name: 'Ozone Clarity Facial', desc: 'Clarifying facial treatment for cleaner, fresher and healthier-looking skin.', off: '20% Off', img: '/services/ozone-clarity-facial.webp' },
    { name: 'BB Glow', desc: 'Glow-enhancing treatment for smoother, brighter and naturally radiant-looking skin.', off: '20% Off', img: '/services/bb-glow.webp' },
  ]},
  { group: 'Anti-Ageing & Aesthetics', items: [
    { name: 'HIFU', desc: 'Non-surgical skin tightening treatment for sagging skin, fine lines and facial lifting.', off: '30% Off', img: '/services/hifu.webp' },
    { name: 'Botox', desc: 'Aesthetic injectable treatment for fine lines, wrinkles and facial expression lines.', off: '20% Off', img: '/services/botox.webp' },
    { name: 'Mono Threads', desc: 'Thread-based aesthetic procedure for skin support, firmness and refined facial appearance.', off: '20% Off', img: '/services/mono-threads.webp' },
    { name: 'COG Threads', desc: 'Advanced thread lift option for facial contouring, lifting and skin tightening support.', off: '20% Off', img: '/services/cog-threads.webp' },
    { name: 'Glutathione IV Drip', desc: 'Glow and wellness-focused IV drip treatment performed under expert clinical guidance.', off: '20% Off', img: '/services/glutathione-iv-drip.webp' },
  ]},
  { group: 'Cosmetic Procedures', items: [
    { name: 'Lip Tint', desc: 'Enhance natural lip color with a refined lip tint treatment for a fresh look.', off: '20% Off', img: '/services/lip-tint.webp' },
    { name: 'Microblading (Eyebrow)', desc: 'Defined eyebrow enhancement treatment for natural-looking fuller and shaped brows.', off: '20% Off', img: '/services/microblading.webp' },
  ]},
]

// Trust badges, matching the ones on the live site. `icon` maps to STAT_ICONS.
// The Google rating is filled in from REVIEW_RATING below so the badge can never
// contradict the reviews section.
export const STATS = [
  { icon: 'trophy', value: '15+ Years', label: 'Experience' },
  { icon: 'verified', value: 'US FDA', label: 'Approved Technology' },
  { icon: 'users', value: '20K+', label: 'Happy Patients' },
  { icon: 'google', value: null, label: 'Google Reviews' }, // value = `${score} / 5`
]

// Real Google reviews for Kotil Skin Science (from the clinic's Google listing —
// 4.5★ / 118 reviews). Replace / extend with the latest from your Google profile.
export const REVIEWS = [
  { name: 'Nidhi Malhotra', when: '4 months ago', stars: 5, text: 'My experience at Kotil Skin Science is very nice. I liked the way they treated me, Reena Verma ji tackled everything very nicely. Kotil is highly recommended.' },
  { name: 'Shama Bano', when: '5 months ago', stars: 5, text: 'Good service, good staff and good nature. A very comfortable and professional experience. 👍' },
  { name: 'Arti Yadav', when: '5 months ago', stars: 5, text: 'It was an awesome experience. The team is caring and the results really show.' },
  { name: 'Pooja Sharma', when: '3 months ago', stars: 5, text: 'Went in for pigmentation treatment. Proper diagnosis first, no random packages pushed, genuinely doctor-led. Very happy with the results.' },
]

// The #lrd fragment opens Google's panel for THIS listing rather than a plain
// search page. The trailing index picks the tab: ,1, = read reviews,
// ,3, = write a review.
export const REVIEW_RATING = {
  score: '4.5',
  count: 118,
  url: 'https://www.google.com/search?q=Kotil+Skin+Science+reviews#lrd=0x390cfb47f47a0b8b:0xa11889d3fd01ecd7,1,,,,',
  writeUrl: 'https://www.google.com/search?q=Kotil+Skin+Science+reviews#lrd=0x390cfb47f47a0b8b:0xa11889d3fd01ecd7,3,,,,',
}

// Hero banner slides. Each has a landscape (desktop) and portrait (mobile)
// image; the carousel picks the right one per viewport. `href` is the click
// target (the CTA baked into each banner). Optimise via `npm run assets:banners`.
export const BANNERS = [
  // The monsoon slide is a whole-clinic offer, so it scrolls to the full menu.
  // Every other slide sells ONE treatment, so it opens WhatsApp with that
  // treatment already written into the message (see bookLink in config.js).
  { id: 'monsoon', desktop: '/banners/1-monsoon-desktop.webp', mobile: '/banners/1-monsoon-mobile.webp', alt: 'Monsoon Special Offer: flat up to 30% off on all treatments', href: '#treatments', cta: 'See all treatments' },
  { id: 'lhr',     desktop: '/banners/2-lhr-desktop.webp',     mobile: '/banners/2-lhr-mobile.webp',     alt: 'Advanced Laser Hair Reduction with Soprano Titanium technology', href: bookLink('Laser Hair Reduction'), cta: 'Book Laser Hair Reduction on WhatsApp' },
  { id: 'hydra',   desktop: '/banners/3-hydra-desktop.webp',   mobile: '/banners/3-hydra-mobile.webp',   alt: 'Advanced 17-in-1 Hydra Facial technology', href: bookLink('the 17-in-1 Hydra Facial'), cta: 'Book the 17-in-1 Hydra Facial on WhatsApp' },
  { id: 'hifu',    desktop: '/banners/4-hifu-desktop.webp',    mobile: '/banners/4-hifu-mobile.webp',    alt: 'Non-surgical HIFU skin tightening and facial lift', href: bookLink('HIFU Skin Tightening & Facial Lift'), cta: 'Book HIFU Skin Tightening on WhatsApp' },
]

// Before/after results. Populate by dropping the originals into
// raw-assets/results/ and running `npm run assets:results`, which writes the
// optimised files to public/results/. The section hides itself while empty.
export const RESULTS = []

// Draggable before/after pairs shown beside the booking CTA. Both frames of a
// pair are cropped to identical dimensions by `npm run assets:compare`, which
// is what lets the slider read as one photo revealing another.
export const COMPARISONS = [
  {
    id: 'stretchmarks',
    label: 'Stretch mark reduction',
    alt: 'Abdomen treated for stretch marks',
    before: '/compare/stretchmarks-before.webp',
    after: '/compare/stretchmarks-after.webp',
    width: 900, height: 676,
  },
  {
    id: 'hair',
    label: 'Hair regrowth',
    alt: 'Scalp treated for hair thinning',
    before: '/compare/hair-before.webp',
    after: '/compare/hair-after.webp',
    width: 900, height: 779,
  },
]

// Clinic videos. Generated by `npm run assets:videos` from raw-assets/videos/.
export const VIDEOS = [
  { src: '/videos/vid-20231004-132907.mp4', poster: '/videos/vid-20231004-132907.webp', title: 'Laser session in progress', vertical: true },
  { src: '/videos/vid-20231004-135808.mp4', poster: '/videos/vid-20231004-135808.webp', title: 'Skin treatment close-up', vertical: true },
  { src: '/videos/vid-20231004-140801.mp4', poster: '/videos/vid-20231004-140801.webp', title: 'Inside the treatment room', vertical: true },
  { src: '/videos/inshot-20250119-181127074.mp4', poster: '/videos/inshot-20250119-181127074.webp', title: 'A visit to Kotil Skin Science', vertical: true },
  { src: '/videos/vid-20250605-174514.mp4', poster: '/videos/vid-20250605-174514.webp', title: 'Clinic walkthrough', vertical: true },
]

// Clinic gallery — real photos. `cls` places each tile explicitly so the bento
// tiles a perfect 4×3 rectangle with NO gaps (see .gtile--a..f in CSS).
export const GALLERY = [
  { src: '/clinic/g1.webp', alt: 'Kotil Skin Science reception lounge', cls: 'a' }, // 2×2 feature
  { src: '/clinic/g6.webp', alt: 'Advanced laser & aesthetic machines', cls: 'b' }, // top small
  { src: '/clinic/g2.webp', alt: 'Kotil branded reception area', cls: 'c' },         // top small
  { src: '/clinic/g4.webp', alt: 'Treatment room with skin-analysis wall', cls: 'd' }, // tall
  { src: '/clinic/g7.webp', alt: 'Clean, hygienic treatment bay', cls: 'e' },        // tall
  { src: '/clinic/g3.webp', alt: 'Product shelves and consultation lounge', cls: 'f' }, // wide bottom
]

export const FAQS = [
  { q: 'Which is the best skin clinic near Preet Vihar?', a: 'Kotil Skin Science is a doctor-led skin, hair and body clinic in Preet Vihar, East Delhi, trusted for diagnosis-first consultations, strict hygiene and advanced, personalised treatments.' },
  { q: 'Which skin treatments are available at Kotil Skin Science?', a: 'Acne & acne-scar care, pigmentation and melasma treatment, Q-switched laser, laser hair reduction, HIFU skin tightening, chemical peels, open-pore treatment and PRP hair regrowth, among others.' },
  { q: 'Is Kotil Skin Science near Laxmi Nagar and Nirman Vihar?', a: 'Yes. We are easily reachable from Laxmi Nagar, Nirman Vihar, Anand Vihar and Mayur Vihar across East Delhi.' },
  { q: 'How many sessions are needed for pigmentation treatment?', a: 'It depends on the type and depth of pigmentation. Most clients see visible improvement within 4 to 6 sessions, planned after a proper skin analysis.' },
  { q: 'Do you provide consultation before treatment?', a: 'Always. Every plan begins with a one-on-one consultation and skin diagnosis so your treatment is safe, transparent and built around you.' },
  { q: 'Can pigmentation, melasma and dark spots be treated?', a: 'Yes, with medical-grade protocols combining Q-switched laser, peels and topical care, tailored to your skin type and concern.' },
  { q: 'Do you provide laser hair reduction for women?', a: 'Yes. Our diode laser platform offers near-painless, long-lasting hair reduction for every skin type, in a private and comfortable setting.' },
  { q: 'Is laser hair removal safe?', a: 'When performed by trained professionals with correct device settings, laser hair reduction is safe and clinically proven. We follow strict hygiene and safety standards.' },
]
