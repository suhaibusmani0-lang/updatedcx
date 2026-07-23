# Test Credentials — Cosmopolitan Xccessories

## Admin
- **Email:** `admin@example.com`
- **Password:** `Admin@123`
- Access: `/admin/dashboard` + `/admin/categories` + `/admin/orders`

## Customer (email/password login, verified)
- **Email:** `customer@example.com`
- **Password:** `User@123`
- After login, an OTP is emailed (or logged in SMTP transporter). Fetch latest OTP from MongoDB:
  ```
  mongosh cosmopolitan_shop --eval 'db.otps.find({email:"customer@example.com"}).sort({createdAt:-1}).limit(1).toArray()'
  ```

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
