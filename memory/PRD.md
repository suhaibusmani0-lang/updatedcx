# PRD — Cosmopolitan Ecommerce (Next.js on Cloudflare Workers)

## Original Problem Statement
1. (Earlier session) Git repo broken, deploy failing — fixed wrangler.toml TOML errors.
2. (June 2026) User: "category aur sub category page, product detail page open nahi ho rahe, MongoDB baar-baar website se hat ja raha hai — permanent solution chahiye."
Live URL: https://finalcxcshop.projectdemohp.workers.dev/

## Architecture
- Next.js 16 (App Router) deployed to Cloudflare Workers via @opennextjs/cloudflare
- MongoDB Atlas via mongoose 9 (cluster: cosmopolitanxccessories, db: support_db)
- Cloudinary images, Razorpay payments, Firebase phone auth, Nodemailer emails

## Root Causes Found (June 2026 session)
1. **Stale mongoose connection on Cloudflare Workers**: Workers close TCP sockets between
   requests ("Cannot perform I/O on behalf of a different request"). Old `connectDB` cached
   the connection forever → intermittent Cloudflare error 1101 / 500 on APIs and pages.
2. **Mongoose `$wasForceClosed` bug**: `connection.close(true)` sets `$wasForceClosed=true`
   and mongoose NEVER resets it on reconnect → all model queries throw
   "Connection was force closed" forever. Must manually reset after reconnect.
3. **Server pages self-fetching own worker URL**: category/products pages fetched
   `NEXT_PUBLIC_BASE_URL/api/...` from inside the worker (unreliable subrequest, doubles
   failure rate). Converted to direct DB queries.

## Fixes Applied (June 2026)
- `lib/databaseConnection.js` — rewritten: ping-validates connection each request,
  force-reconnects when stale, retry once, dedup via `globalThis.__mongoConnState`
  (each Next chunk bundles its own module copy), resets `$wasForceClosed` after connect.
- ROUND 2 (refresh bug on deployed worker): on Workers, `close(true)` on a stale socket
  itself throws/hangs, leaving readyState=1, so `mongoose.connect()` short-circuited and
  returned the dead connection. Fix: timeout-wrapped close + ping, then force
  `mongoose.connection.readyState = 0` so openUri creates a brand-new MongoClient.
  VERIFIED on real workerd (wrangler dev, Node 22 at /tmp/node-v22.14.0-linux-arm64):
  5 refresh rounds + post-idle requests all 200, zero stale-socket errors.
- `app/(website)/category/[slug]/page.tsx` — direct DB query (was self-fetch).
- `app/(website)/products/page.tsx` — direct DB query (was self-fetch).
- `app/(website)/products/[slug]/page.tsx` — direct DB query + fixed similar-products
  bug (was reading wrong response shape, never showed).
- `.env.local` / `.dev.vars` created locally (gitignored) for testing.

## Verification (local, next build + next start)
- All 5 category pages (decor, home-fragrance, tabletop-bar, bakhoor-incense, new): 200
- /product/[slug], /products, /products/[slug]: 200
- /api/categories, /api/products, /api/products/[slug], /api/categories?slug=: 200
- Parallel hammer (10 concurrent): all 200, zero DB errors in logs
- Screenshot: category page renders with products, filters, prices

## Deployment (USER ACTION REQUIRED)
Code is fixed locally but must be deployed to Cloudflare:
- Option A: "Save to GitHub" from chat → Cloudflare auto-build (if connected)
- Option B: locally `npm install && npm run deploy` (needs wrangler login)
- Ensure Atlas Network Access allows 0.0.0.0/0 (Workers IPs vary)

## Backlog
- Move secrets from wrangler.toml [vars] to Cloudflare secrets (leaked in git history — rotate!)
- Category page: include child-subcategory products on parent category
- Durable Object connection pooling (optional latency optimization)
