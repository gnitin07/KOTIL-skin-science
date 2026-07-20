/**
 * Single source of truth for everything about the business.
 * Change a phone number / address / social handle HERE and it updates every
 * link, button and prefilled WhatsApp message across the whole site.
 */

export const CLINIC = {
  name: 'Kotil Skin Science',
  tagline: 'Skin · Hair · Body',
  // Digits only, with country code — used to build tel: and wa.me links.
  phone: '919871054183',
  phoneDisplay: '+91 98710 54183',
  email: 'info@kotilskinscience.com',
  address: {
    line1: 'Plot No-8, Shankar Vihar, Preet Vihar',
    line2: 'New Delhi, Delhi 110092',
    area: 'Preet Vihar, East Delhi',
    // Used for both the embedded map and the "Get directions" link.
    query: 'Plot No-8 Shankar Vihar Preet Vihar New Delhi 110092',
  },
}

export const SOCIALS = [
  { id: 'ig', label: 'Instagram', url: 'https://www.instagram.com/kotil.skinscience/' },
  { id: 'fb', label: 'Facebook', url: 'https://www.facebook.com/kotilskinscience/' },
  { id: 'x', label: 'X', url: 'https://x.com/Kotilskins21295' },
  { id: 'pin', label: 'Pinterest', url: 'https://in.pinterest.com/kotilskinscience/' },
]

// ---- derived links -------------------------------------------------------

export const telLink = `tel:+${CLINIC.phone}`
export const mailLink = `mailto:${CLINIC.email}`

/** WhatsApp deep link with a prefilled message. */
export const waLink = (message) =>
  `https://wa.me/${CLINIC.phone}?text=${encodeURIComponent(message)}`

/** "I want to book <treatment>" — used by every treatment card on the site. */
export const bookLink = (treatment) =>
  waLink(
    `Hi ${CLINIC.name}, I'd like to book an appointment for ${treatment}. ` +
    `Please share the available slots and pricing.`
  )

/** Generic appointment enquiry (hero / CTA / panel footer). */
export const enquireLink = waLink(
  `Hi ${CLINIC.name}, I'd like to book an appointment.`
)

const mapQuery = encodeURIComponent(CLINIC.address.query)
export const directionsLink = `https://www.google.com/maps/search/${mapQuery}`
export const mapEmbedSrc = `https://maps.google.com/maps?q=${mapQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`
