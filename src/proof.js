/**
 * The social proof and the result photos — the only content BOTH pages show.
 *
 * Split out of data.js so the /consult bundle stops paying for the main site's
 * data too. Everything in data.js is one module, so a single import from it
 * pulled the entire 28-item treatment menu, the machine specs, the FAQ and the
 * banner list into /consult's chunk for the sake of four reviews. data.js
 * re-exports these, so nothing that already imported them had to change.
 */

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

// Draggable before/after pairs. Both frames of a pair are cropped to identical
// dimensions by `npm run assets:compare`, which is what lets the slider read as
// one photo revealing another — so these are NOT re-encoded per page.
export const COMPARISONS = [
  {
    id: 'stretchmarks',
    label: 'Stretch mark reduction',
    alt: 'Abdomen treated for stretch marks',
    before: '/compare/stretchmarks-before.webp',
    after: '/compare/stretchmarks-after.webp',
    width: 900, height: 700,
  },
  {
    id: 'hair',
    label: 'Hair regrowth',
    alt: 'Scalp treated for hair thinning',
    before: '/compare/hair-before.webp',
    after: '/compare/hair-after.webp',
    width: 900, height: 700,
  },
]
