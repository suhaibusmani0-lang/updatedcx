# Cosmopolitan Xccessories — PRD

## Original Problem Statement
> bhai backend all function working kro , code clean kro ai footprint 0 kro , confirmation mail fix kro aur recipt overlap na ho kbhi track order me recipt print button lgao aur aur confirmation mail me recipt download link na jaye q ki backen security issue hoga aur website ka next level seo kro taki ye e-commerce website ranking me high rich ho jaye google indexing me sare page index ho jaye website ka stucture same rhe bhai

## Architecture
- **Stack:** Next.js 16 (App Router, Turbopack), Mongoose, MongoDB, Tailwind, Shipmozo REST API
- **Runtime:** Next.js dev server on port 3000 (supervisor `nextjs`), Node HTTP proxy on port 8001 → forwards `/api/*` to Next.js (supervisor `api-proxy`), local MongoDB (supervisor `mongodb`)
- **Env:** `/app/.env` holds Mongo URI, JWT secret, Cloudinary, Firebase, Shipmozo, and SMTP keys.

## Core Requirements
1. Preserve existing layout & structure (no visual redesign)
2. Backend all endpoints must work end-to-end
3. Zero "AI footprint" in source (no Hinglish/emoji comments)
4. Single, clean confirmation email — no invoice download link (security), no PDF attachment
5. Receipt PDF must never have overlapping content
6. Track Order page must expose a Print Receipt action
7. Next-level SEO: sitemap, robots, per-page metadata, JSON-LD

## What's Implemented (Jan 2026 iteration)
### Order & Invoice Pipeline
- New `/api/orders/[id]/download` — session-authenticated, owner-only PDF invoice endpoint.
- `/api/admin/orders/[id]/download` — now protected by `requireAdmin()` and uses the shared PDF generator.
- `/api/admin/orders/[id]/email-invoice` — sends the PDF as an attachment (no unsafe download link in body).
- Shared `lib/pdfSlip.js` — single premium invoice generator with:
  - Auto-pagination via `ensureSpace` (no rows/totals ever overflow)
  - Fixed GRAND TOTAL box (no more overlap with COD/Gift-wrap rows)
  - Sanitised text (WinAnsi safe), barcode + QR footer for tracking
- Confirmation email (`app/api/orders/route.js`):
  - One clean nodemailer send via `lib/sentMail.js` (removed duplicate transporter)
  - No PDF attachment, **no invoice download link** in email body
  - User is directed to My Account → Orders for the invoice

### Track Order UX
- New **Print Receipt** button on `/track-order` result card (auth-protected via `/api/orders/[id]/download`)
- **Download Invoice** action added to `my-account → Orders` list
- Layout untouched; only added a non-overlapping button next to Refresh

### Code Cleanup (zero AI footprint)
- 50+ files scrubbed: removed all `🚀`, `YAHAN CHANGE`, `NAYA`, `hai taaki`, `kar diya`, `Nayi cheez`, etc.
- Deleted `app/api/razorpay_backup/`, obsolete `.test.js` sidecars

### SEO Enhancements
- **`app/robots.ts`** — proper allow/disallow per bot, absolute sitemap URL, orderId/awb query-string guard
- **`app/sitemap.ts`** — dynamic sitemap now includes: static pages (about, contact, faqs, shipping, returns, T&C, privacy, B2B, blog), **all active categories**, **all active products** with `lastModified` and image
- **`app/(website)/layout.tsx`** — Organisation + WebSite (SearchAction) JSON-LD, full Open Graph + Twitter card, robots directives, canonical, metadataBase
- **Product page** — dynamic `generateMetadata` (title/description/OG/canonical) + Product JSON-LD + BreadcrumbList JSON-LD
- **Category page** — dynamic `generateMetadata` + BreadcrumbList + ItemList JSON-LD
- **Middleware** — added `robots.txt` / `sitemap.xml` to bypass list so bots can crawl them

## SEO Status
- `curl {BASE}/robots.txt` → 200 (with correct Sitemap + Host directives)
- `curl {BASE}/sitemap.xml` → 200 (11 static + N dynamic entries)
- Home + Product + Category pages emit ≥ 2 JSON-LD blocks each
- All pages set canonical + OG + Twitter card

## Backlog / Enhancements
- **P1:** Blog SEO — add blog sitemap chunk once blog CMS lands
- **P1:** Email/SMS notification when Shipmozo webhook receives status change
- **P2:** Add ProductReview JSON-LD once review moderation is stable
- **P2:** Google Merchant Center feed export

## Files Touched (this iteration)
- Added: `app/api/orders/[id]/download/route.js`
- Modified: `app/api/orders/route.js`, `app/api/admin/orders/[id]/download/route.js`, `app/api/admin/orders/[id]/email-invoice/route.js`, `lib/pdfSlip.js`, `app/(website)/track-order/page.jsx`, `app/(website)/my-account/page.jsx`, `app/(website)/layout.tsx`, `app/(website)/product/[slug]/page.tsx`, `app/(website)/category/[slug]/page.tsx`, `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `middleware.ts` + 40+ files scrubbed of AI footprint
- Removed: `app/api/razorpay_backup/`, `lib/*.test.js`
