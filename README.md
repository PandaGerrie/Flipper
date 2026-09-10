# Flipper

Turn any public PDF URL into an embeddable flipbook. PDFs stay on their original host; Flipper only renders them.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a public PDF URL, then copy the head script + body placeholder.

## Embed API

**In `<head>` (once per page):**

```html
<script src="https://YOUR_DOMAIN/embed.js" defer></script>
```

**Inline flipbook:**

```html
<div class="fl-flipbook" data-src="https://url.to.your/file.pdf"></div>
```

**Fullscreen button** (same placeholder, with `type="button"`):

```html
<div class="fl-flipbook" type="button" data-src="https://url.to.your/file.pdf"></div>
```

Optional attributes: `data-width`, `data-height`, `data-label` (button text), `data-title`.

## Domain allowlist

Set `EMBED_SITES` in `.dev.vars` (local) or Cloudflare Worker env (production) to lock embeds to specific root domains:

```bash
EMBED_SITES=["client-a.be","client-b.com","localhost"]
```

Each entry allows that host and all subdomains. Empty / unset = open (any site can embed). No client-side keys.

## Test PDFs

Use these public URLs while developing or documenting Flipper:

| PDF | URL | Good for |
| --- | --- | --- |
| Attention Is All You Need | https://arxiv.org/pdf/1706.03762 | Clickable links (citations, figures, external refs), multi-page scrubbing |
| TraceMonkey (PDF.js sample) | https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf | Quick smoke test / short document |

The home page **Try example** button loads the arXiv paper above.

Local widget smoke test: [public/widget-demo.html](public/widget-demo.html) (`/widget-demo.html` in dev).

## Deploy (Cloudflare Workers)

```bash
npm run deploy
```

Or connect the repo as a **Worker** (not static Pages) with:

- Build: `npx opennextjs-cloudflare build`
- Deploy: `npx wrangler deploy`
