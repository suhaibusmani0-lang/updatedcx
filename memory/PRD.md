# Cosmopolitan Xccessories — PRD

## Original Problem Statement
> bhai is website ka structure aur layout bilkul change nahi krna hai isme real time order tracking system ho full code clean kro aur all function working kro aur bhai mobile view me menu me Business To Business, Track Order ye do button bhi add krna bootom me hai order traking real time ho order id awb apne aap aa jaye ship mozo se

## Architecture
- **Stack:** Next.js 16 (App Router, Turbopack), Mongoose, MongoDB, Tailwind, ShipMozo REST API
- **Runtime:** Next.js dev server on port 3000 (supervisor `nextjs`), Node HTTP proxy on port 8001 → forwards `/api/*` to Next.js (supervisor `api-proxy`), local MongoDB (supervisor `mongodb`)
- **ShipMozo keys:** `NEXT_PUBLIC_SHIPMOZO_PUBLIC_KEY`, `SHIPMOZO_PRIVATE_KEY` present in `/app/.env`

## Core Requirements
1. Preserve existing layout & structure (no visual redesign)
2. Real-time order tracking (auto-refresh every 30s)
3. Order ID + AWB come from ShipMozo automatically (via webhook)
4. Mobile menu bottom links: **Business To Business** + **Track Order**
5. Public track-order page usable without login

## What's Implemented (Jan 2026)
- **Track Order page** (`/track-order`) — public, real-time timeline, refresh polling every 30s, terminal states stop polling
- **`/api/orders/track`** — merges DB history + live ShipMozo tracking (via `track-order?awb_number=`)
- **`/api/shipmozo/create-order`** — pushes order to ShipMozo, saves `shipmozoOrderId` + raw response back to our order document
- **`/api/shipmozo/webhook`** — receiver for ShipMozo push updates (AWB assignment, status changes). Supports optional shared secret via `SHIPMOZO_WEBHOOK_SECRET`
- **Order model** extended with: `shipmozoOrderId`, `awbNumber`, `courierName`, `courierId`, `currentTrackingStatus`, `expectedDeliveryDate`, `trackingHistory[]`, `lastTrackedAt`, `shipmozoPushed`, `shipmozoRawResponse`
- **Header mobile drawer** — added `Business To Business` + `Track Order` links at bottom (with `data-testid`)
- **My Account → Orders** — each order now has a **Track Order** button linking to `/track-order?orderId=<id>`
- **Admin Orders page** — new **Tracking** column showing AWB / courier / current status + **Assign AWB manually** link
- **Admin PUT `/api/admin/orders/[id]`** — now accepts `awbNumber`, `courierName`, `shipmozoOrderId` and appends an "AWB Assigned" event to history
- **`/lib/shipmozo.js`** — reusable client (`pushOrder`, `trackOrderByAwb`, `getWarehouses`, `normaliseTracking`)
- **`middleware.ts`** — added `/track-order` to public routes
- **Bug fix in `lib/databaseConnection.js`** — TLS regex updated so local Mongo (`tls=false`) works without being force-flipped to `tls=true`

## Real-time Tracking Flow
1. Customer places order → order saved in DB with status `Pending`
2. Checkout automatically POSTs to `/api/shipmozo/create-order` → ShipMozo returns internal `order_id` → we persist it as `shipmozoOrderId` + set status `Processing`
3. ShipMozo assigns a courier and generates AWB → sends webhook to `/api/shipmozo/webhook` → we save `awbNumber`, `courierName`, tracking event, and map status → `Shipped`
4. Customer visits `/track-order?orderId=<id>` → page auto-refreshes every 30s → server calls ShipMozo `GET /track-order?awb_number=<awb>` for latest events → merges into `trackingHistory` and returns to UI

## ShipMozo Webhook Setup (Manual)
User must configure the webhook URL in ShipMozo dashboard →
```
{NEXT_PUBLIC_BASE_URL}/api/shipmozo/webhook?secret=cxc-shipmozo-webhook-2026
```

## Backlog / Enhancements
- **P1:** Email/SMS notification when webhook receives status change
- **P1:** Branded, shareable tracking page with product images
- **P2:** Estimated Delivery Date on order confirmation
- **P2:** Multi-warehouse ShipMozo support (currently hard-coded `warehouse_id: 26652`)
- **P2:** Cron job to poll `/track-order` every 15 minutes for shipped orders (in case webhook missed)

## Files Touched
- Added: `app/api/orders/track/route.js`, `app/api/shipmozo/webhook/route.js`, `app/(website)/track-order/page.jsx`, `lib/shipmozo.js`, `scripts/api-proxy.js`
- Modified: `models/Order.model.js`, `app/api/shipmozo/create-order/route.js`, `app/api/admin/orders/[id]/route.js`, `app/(admin)/admin/orders/page.jsx`, `app/(website)/my-account/page.jsx`, `components/website/header/Header.tsx`, `middleware.ts`, `next.config.ts`, `lib/databaseConnection.js`, `.env`
