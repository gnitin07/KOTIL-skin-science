# Hosting Kotil Skin Science on Hostinger

The site is fully static — no Node process, no database, no API. Hostinger
serves the contents of `dist/` and `.htaccess` does the routing.

**Two pages, two HTML files.** `dist/` contains `index.html` (the main site) and
`consult.html` (the ₹99 landing page for paid ads). They are separate Vite
entries and share no JavaScript or CSS beyond React, so an ad click does not
download the homepage's GSAP bundle. `.htaccess` rewrites `/consult` to
`/consult.html` — if that rule is lost, ad traffic lands on a 404. `vercel.json`
carries the same rewrite for the rollback host; the two must agree.

## Why the build happens on your machine, not on Hostinger

Hostinger's Git integration clones the repo into `public_html` verbatim. It does
not run `npm install` or `npm run build`. Since `dist/` is gitignored, a Git
deploy would publish source code and the visitor would see a directory listing,
not the site.

So: build locally, upload the result. This is not a workaround — for a static
site there is nothing a build server would add.

## Deploy

```bash
npm ci
npm run build
```

Then upload **the contents of `dist/`** — not the `dist` folder itself — into
`public_html`. Either drag them into hPanel → File Manager, or zip `dist` and
use File Manager's "Extract".

**Check that `.htaccess` actually arrived.** It starts with a dot, so File
Manager hides it by default (Settings → "Show hidden files") and some FTP
clients skip it silently. If it is missing the site loads but `/consult` 404s
and every visitor re-downloads 20 MB of media. This is the single most likely
thing to go wrong.

## Smoke test before touching DNS

Hostinger gives the site a temporary `*.hostingersite.com` address. Verify
there first — the domain still points at Vercel at this stage, so nothing is at
risk.

| Visit | Expect |
|---|---|
| `/` | homepage loads, video plays |
| `/consult` typed directly | ₹99 consultation landing page, URL stays `/consult` |
| `/contact-us/` | 301 to `/#contact`, page scrolls to contact |
| `/services/` | 301 to `/#treatments` |
| `/some-old-wordpress-url` | 301 to `/` |
| `/sitemap.xml`, `/robots.txt` | served as files, not redirected |

Then in DevTools → Network, reload twice and confirm files under `/assets/`,
`/videos/` and `/banners/` come back `(disk cache)` with
`Cache-Control: public, max-age=31536000, immutable`.

If you get a 500 on every page, the `.htaccess` is the cause — rename it to
`htaccess.txt`, confirm the site returns, then fix and rename back.

## Rollback

`vercel.json` stays in this repo and stays authoritative for Vercel. Nothing
about this setup breaks the existing deploy, so pointing the domain back at the
Vercel address restores the previous site with all its redirects intact.

## When routing changes

`vercel.json` and `.htaccess` describe the same 14 redirects for two different
servers. Edit both, or one platform quietly diverges from the other. They are
frozen legacy WordPress URLs, so this should be rare.

**Do not put `"//"` comment keys in `vercel.json`.** JSON has no comments, and
the `"//"` convention used to pass silently — but Vercel now schema-validates
the file and rejects unknown properties outright (`headers[0] should NOT have
additional property "//"`), failing the build before it starts. That is why the
notes below live here instead. `.htaccess` is a real config format and keeps its
comments inline.

### What each `vercel.json` rule is for

**`rewrites`, in order — the order is load-bearing.**

1. `/consult` → `/consult.html`. The landing page is its own built page, not a
   client-side route into `index.html`. A rewrite rather than a redirect, so the
   address bar keeps the clean `/consult` the ads point at. It must stay above
   the catch-all, which would otherwise hand it the homepage.
2. `/consult/` → same, for the trailing-slash form.
3. `/(.*)` → `/index.html`, the SPA catch-all.

The big negative-lookahead redirect above them excludes `consult`, the asset
directories and the root files; Vercel evaluates redirects before touching the
filesystem, so anything that must be served as a real file has to be named there
by hand. Apache does not need this — `.htaccess` just asks whether the file
exists (`-f`), which is why that file has no equivalent regex.

**`headers`.**

- `/(assets|banners|clinic|compare|services|videos|results)/(.*)` gets one year,
  `immutable`. Every file in those directories has a stable generated name from
  the `scripts/*.mjs` pipeline, so a repeat visitor should never re-download one,
  and `immutable` skips the revalidation round-trip entirely.
  **Trade-off:** replacing an image in place will never reach anyone who already
  cached it. To publish a changed picture, give it a new filename
  (`g7.webp` → `g8.webp`). That is what the asset scripts are for.
- Icons and `og.jpg` get a week instead — they change rarely, but they *are*
  replaced in place, so a year would strand them.
- The global rule sets `X-Content-Type-Options` and deliberately sets **no**
  `Cache-Control`: a second rule matching the same path with the same key would
  fight the `immutable` rule above. HTML keeps Vercel's default
  (`max-age=0, must-revalidate`) so a deploy goes live immediately.
