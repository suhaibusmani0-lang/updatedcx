# Test Credentials — Cosmopolitan Xccessories

## Admin
- **Email:** `admin@example.com`
- **Password:** `Admin@123`
- Access: `/admin/dashboard`, `/admin/categories`, `/admin/orders`

## Customer (email/password login, email verified)
- **Email:** `customer@example.com`
- **Password:** `User@123`
- **Login flow:** password → OTP is generated and stored in the `otps` collection (or emailed if SMTP configured).
- Fetch latest OTP from MongoDB:
  ```
  mongosh cosmopolitan_shop --quiet --eval 'db.otps.find({email:"customer@example.com"}).sort({createdAt:-1}).limit(1).toArray()[0].otp'
  ```

## Test Product (in DB)
- **Slug:** `test-bakhoor-burner`
- **Product ID:** `6a68fbc61d8f637222a84a7c` (may change after re-seed)
- Price: 2999 / Sale: 2499, Stock: 100
- Category: `home-decor`

## Test Order (public tracking)
- **Order ID:** `6a626cab81c467b16d15419d`
- **AWB:** `14519999999999`
- Tracking URL: `/track-order?orderId=6a626cab81c467b16d15419d`

## ShipMozo
- Public key (in `.env`): `NEXT_PUBLIC_SHIPMOZO_PUBLIC_KEY=lj07h5nGTIMHB3OVWXEN`
- Private key (in `.env`): `SHIPMOZO_PRIVATE_KEY=gAIHKCDSuh6lXQx1OeGo`
- Webhook secret (in `.env`): `SHIPMOZO_WEBHOOK_SECRET=cxc-shipmozo-webhook-2026`
- Webhook URL: `{BASE_URL}/api/shipmozo/webhook?secret=cxc-shipmozo-webhook-2026`

## MongoDB
- Local: `mongodb://127.0.0.1:27017/cosmopolitan_shop?tls=false`

## Seed script
- `node /app/scripts/seed-test.mjs` — idempotent, re-creates test customer, admin, category and product.
