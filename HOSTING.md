# Hosting Kotil Skin Science on Hostinger

The site is fully static — no Node process, no database, no API. Hostinger
serves the contents of `dist/` and `.htaccess` does the routing.

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
| `/consult` typed directly | consult view, URL stays `/consult` |
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
