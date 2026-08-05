import { useState } from 'react'
import Img from './Img.jsx'

/**
 * One clip in the video bento.
 *
 * The <video poster> attribute cannot do content negotiation — no <picture>,
 * no srcset — and it ignores loading="lazy", so all five posters used to
 * download as full-size WebP during first paint (~353KB) for a section most
 * visitors never scroll to. Rendering the poster as a normal <Img> instead
 * makes it lazy AND lets it serve AVIF.
 *
 * The <video> itself only mounts once the tile is clicked. That is the same
 * single click the native play button already cost, and it keeps preload="none"
 * honest: nothing from /videos/*.mp4 crosses the wire until someone asks.
 */
export default function VideoCard({ src, poster, title, showPoster = true }) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <video
        src={src}
        poster={poster}
        controls
        autoPlay
        playsInline
      />
    )
  }

  return (
    <button className="vcard__play" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`}>
      {/* eager once showPoster flips — the .vcard around this is GSAP-hidden
          until its ScrollTrigger fires, so lazy here would never beat the
          reveal. The parent gates on .vids__grid instead. */}
      {showPoster && <Img src={poster} alt="" loading="eager" />}
      <span className="vcard__playicon" aria-hidden="true">▶</span>
    </button>
  )
}
