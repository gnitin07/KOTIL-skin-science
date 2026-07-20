# KOTIL-skin-science

Scroll-animation marketing site for **Kotil Skin Science** — a doctor-led skin, hair
and body clinic in Preet Vihar, East Delhi.

Built with Vite + React, GSAP ScrollTrigger and Lenis smooth scroll.

---

## Quick start

The high-res source media is versioned with **Git LFS**, so install it *before*
cloning or you'll get 130-byte pointer files instead of images:

```bash
git lfs install                 # once per machine
git clone https://github.com/gnitin07/KOTIL-skin-science.git
cd KOTIL-skin-science

npm install
npm run dev        # http://localhost:5178
npm run build      # production build -> dist/
npm run preview    # serve the built site locally
```

Requires Node 18+. (LFS only affects `raw-assets/`; the site itself builds from
the ordinary files in `public/`, so a clone without LFS still runs fine.)

---

## What's on the page

| Section | Behaviour |
| --- | --- |
| **Hero** | Kinetic `KOTIL SKIN SCIENCE` wordmark + a cut-out treatment photo. Everything animates in on load; parallaxes out on scroll. |
| **Technology** | Pinned "machine rig" — the clinic's 5 real machines cross-fade one into the next within a single viewport scroll. |
| **Marquee** | Infinite gold band that skews with scroll velocity. |
| **Radiance** | Full-bleed parallax-zoom image with a masked headline reveal. |
| **Treatments** | Horizontally-pinned card track, ending in a **See more** card. |
| **All treatments** | Modal with the full 37-treatment menu in 8 groups; each card books via WhatsApp. |
| **Stats** | Count-up figures. |
| **Gallery** | Bento collage of real clinic photos + click-through lightbox. |
| **Reviews** | Slidable row of real Google reviews with the official Google mark. |
| **FAQ** | Native `<details>` accordion (no JS). |
| **Visit us** | Address, contact points and an embedded Google map. |

---

## Project layout

```
src/
  main.jsx            React entry
  App.jsx             page composition + modal state (markup only)
  animations.js       ALL GSAP/Lenis behaviour, as useSiteAnimations()
  config.js           business info: phone, address, socials, link builders
  data.js             content: machines, treatments, reviews, FAQs, gallery
  index.css           design system + every component style
  components/
    icons.jsx         inline Google + social SVG marks
public/
  assets/             optimised site imagery (webp)
  clinic/             clinic gallery photos
  services/           one photo per treatment (generated, see below)
scripts/              one-off asset pipeline tools (not part of the build)
raw-assets/           original high-res source media — tracked via Git LFS
clinic/               original clinic photos as supplied
```

### Why animations live apart from markup

GSAP targets **global class selectors** (`.rig__machine`, `.hero__team`, …) rather
than refs. Keeping every timeline in `animations.js` means components stay pure
JSX and all timing/pinning behaviour is auditable in one file.

### Why there's a `config.js`

The phone number alone appeared in 11 places. Business details now live in one
module, with helpers that build links:

```js
telLink                      // tel:+91…
bookLink('Full Body LHR')    // WhatsApp, prefilled for that treatment
enquireLink                  // generic appointment enquiry
directionsLink / mapEmbedSrc
```

Change a number or address in `config.js` and the whole site follows.

---

## Asset pipeline

Large originals live in `raw-assets/` (Git LFS). These scripts turn them into the
web-sized files in `public/`. Run them only when source media changes.

```bash
npm run assets:optimize    # raw photos           -> public/assets/*.webp (98% smaller)
npm run assets:services    # services screenshots -> public/services/<slug>.webp (37 crops)
npm run assets:logo        # logo screenshot      -> transparent PNG (dark + light)
npm run assets:favicon     # logo                 -> public/favicon.png
```

`assets:services` is the clever one: it locates each card in a screenshot by
detecting the light "gutter" columns between cards, finds the photo band by
looking for a *sustained* dark run (single dark rows are card borders), and trims
the right edge so the source "% Off" badge never appears.

> `raw-assets/` is ~115 MB and lives in Git LFS. GitHub's free tier allows 1 GB
> of LFS storage and 1 GB of bandwidth per month, so avoid repeatedly cloning
> with LFS enabled. To skip the big files on a build machine:
> `GIT_LFS_SKIP_SMUDGE=1 git clone …`

---

## Gotchas worth knowing

These all caused real bugs — please don't regress them.

- **Nested scrollers inside modals need `data-lenis-prevent`.** Lenis
  `preventDefault()`s wheel events globally, so `lenis.stop()` alone still leaves
  a dialog unscrollable. Modals also stop/start Lenis so the page can't scroll
  behind them.
- **Pins use `pinType: 'transform'`.** Default fixed-position pinning makes the
  element shrink-to-fit; measured before layout settles it bakes a garbage inline
  width and collapses the grid.
- **ScrollTrigger must be refreshed after fonts *and* images load.** Both reflow
  the page; without it the rig pin measures zero length and the machines never
  switch. Don't defer that refresh inside `requestAnimationFrame` — a throttled
  tab may never fire it.
- **No `loading="lazy"` inside modals or GSAP reveals.** Elements that start
  `visibility: hidden` never trigger the native lazy loader, leaving blank images.
- **Never centre a GSAP-animated element with `translate(-50%, -50%)`.** GSAP owns
  `transform`; use auto margins or a flex-centred wrapper.

---

## Deployment

Static build — deploy `dist/` anywhere (Vercel, Netlify, any static host).

```bash
npm run build
```

Total shipped payload is roughly 3 MB, mostly imagery.
